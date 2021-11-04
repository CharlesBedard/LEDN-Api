import mongoose from 'mongoose';
import { AccountModel, Transaction, TransactionModel } from '../schemas';

class TransactionService {
    constructor() {}

    async createTransactionWithAccountUpdate(email: string, amount: number, type: string) {
        // start a session in order for the user/transaction updates to be "atomic"
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const account = await AccountModel.findOne({ email }).session(session);

            const transaction: Transaction = {
                accountId: account,
                amount,
                admin: true,
                type: type === 'credit' ? 'receive' : 'send',
                createdAt: new Date(),
            };

            const transactionObj = new TransactionModel(transaction);
            await transactionObj.save({ session });

            account.balance += type === 'credit' ? transaction.amount : -transaction.amount;
            account.updatedAt = new Date();
            await account.save();

            await session.commitTransaction();
        } catch (error) {
            // if error, abort transaction reverts all changes made during transaction before failure
            await session.abortTransaction();
            console.error(error);
            // rethrow the error
            throw error;
        } finally {
            // ending the session
            session.endSession();
        }
    }

    async createTransferWithAccountUpdates(senderEmail: string, recipientEmail: string, amount: number) {
        // start a session in order for the user/transaction updates to be "atomic"
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // get the sender and recipient accounts
            const sender = await AccountModel.findOne({ email: senderEmail }).session(session);
            const recipient = await AccountModel.findOne({ email: recipientEmail }).session(session);

            if (!sender) throw new Error(`Error fetching user with email: ${senderEmail}`);
            if (!recipient) throw new Error(`Error fetching user with email: ${recipientEmail}`);

            const sendTransaction: Transaction = {
                accountId: sender,
                amount,
                admin: false,
                type: 'send',
                createdAt: new Date(),
            };

            const receiveTransaction: Transaction = {
                accountId: recipient,
                amount,
                admin: false,
                type: 'receive',
                createdAt: new Date(),
            };

            const sendTransactionModel = new TransactionModel(sendTransaction);
            const receiveTransactionModel = new TransactionModel(receiveTransaction);

            await sendTransactionModel.save({ session });
            await receiveTransactionModel.save({ session });

            sender.balance -= amount;
            sender.updatedAt = new Date();
            recipient.balance += amount;
            recipient.updatedAt = new Date();

            await sender.save();
            await recipient.save();

            await session.commitTransaction();
        } catch (error) {
            // if error, abort transaction reverts all changes made during transaction before failure
            await session.abortTransaction();
            console.error(error);
            throw error;
            // throw error;
        } finally {
            // ending the session
            session.endSession();
        }
    }
}
export default new TransactionService();
