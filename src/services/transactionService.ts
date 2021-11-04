import { UserModel, Transaction, TransactionModel } from '../schemas/schemas';
import AccountService from '../services/accountService';
import mongoose, { ClientSession } from 'mongoose';

class TransactionService {
    constructor() {}

    async createTransactionWithAccountUpdate(email: string, amount: number, type: string) {
        // start a session in order for the user/transaction updates to be "atomic"
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await UserModel.findOne({ email }).session(session);

            const transaction: Transaction = {
                userId: user,
                amount,
                admin: true,
                type,
                createdAt: new Date(),
            };

            const transactionObj = new TransactionModel(transaction);
            await transactionObj.save({ session });

            user.balance += transaction.type === 'receive' ? transaction.amount : -transaction.amount;
            user.updatedAt = new Date();
            await user.save();

            await session.commitTransaction();
        } catch (error) {
            // if error, abort transaction reverts all changes made during transaction before failure
            await session.abortTransaction();

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
            const sender = await UserModel.findOne({ email: senderEmail }).session(session);
            const recipient = await UserModel.findOne({ email: recipientEmail }).session(session);

            if (!sender) throw new Error(`Error fetching user with email: ${senderEmail}`);
            if (!recipient) throw new Error(`Error fetching user with email: ${recipientEmail}`);

            const sendTransaction: Transaction = {
                userId: sender,
                amount: amount,
                admin: false,
                type: 'send',
                createdAt: new Date(),
            };

            const receiveTransaction: Transaction = {
                userId: recipient,
                amount: amount,
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

            throw error;
            // throw error;
        } finally {
            // ending the session
            session.endSession();
        }
    }
}
export default new TransactionService();
