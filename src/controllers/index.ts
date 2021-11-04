import { UserModel, Transaction, TransactionModel } from '../schemas/schemas';
import { populateDatabase } from '../scripts/populate_db';
import mongoose from 'mongoose';
enum TransactionTypes {
    'send',
    'receive',
}

export const getUsers = async (req: any, res: any) => {
    // validate parameters
    if (!(req.query.email || req.query.userId)) {
        res.status(400).send('Missing parameters. Required parameters are: {email}');
        return;
    }

    const emailParam = req.query.email.toString().toLowerCase();

    // get the account from the email
    let user;
    try {
        user = await UserModel.findOne({ email: emailParam }).lean();
    } catch (err) {
        res.status(404).send(`Error fetching user with email: ${emailParam}`);
    }

    if (!user) res.status(404).send(`No account found for email: ${emailParam}`);

    // TODO: dto
    const stringUser = JSON.parse(JSON.stringify(user));
    res.send(stringUser);
};

export const postResetDb = async (req: any, res: any) => {
    try {
        const r = await populateDatabase(req.query.sampleType.toString());
        res.send(r);
    } catch (err) {
        res.send({ error: err });
    }
};

export const postTransaction = async (req: any, res: any) => {
    // validate body
    if (!(req.body.email && req.body.amount && req.body.type))
        res.status(400).send('Missing parameters. Required parameters are: {email, amount, type}');
    const emailParam = req.body.email.toLowerCase();
    const amountParam = Number(req.body.amount);
    const typeParam = req.body.type.toLowerCase();

    if (!amountParam)
        res.status(400).send(`Error in parameter "number". Must be a number but received ${req.body.amount}`);
    if (!Object.values(TransactionTypes).includes(typeParam)) {
        res.status(400).send(
            `Error in parameter "type". Valid options are { send, receive }, but received: ${req.body.type}`,
        );
    }

    // start a session in order for the user/transaction updates to be "atomic"
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await UserModel.findOne({ email: emailParam }).session(session);

        const transaction: Transaction = {
            userId: user,
            amount: Number(amountParam),
            type: typeParam,
            createdAt: new Date(),
        };

        const transactionObj = new TransactionModel(transaction);
        await transactionObj.save({ session });

        user.balance += transactionObj.type === 'receive' ? transactionObj.amount : -transactionObj.amount;
        await user.save();

        await session.commitTransaction();
    } catch (error) {
        // if anything fails above just rollback the changes here
        // this will rollback any changes made in the database
        await session.abortTransaction();

        // logging the error
        console.error(error);

        // rethrow the error
        throw error;
    } finally {
        // ending the session
        session.endSession();
    }

    res.send({ message: 'Succesfully created transaction', transaction: {} });
};

export const postTransfer = async (req: any, res: any) => {
    // validate body
    if (!(req.body.senderEmail && req.body.recipientEmail && req.body.amount)) {
        res.status(400).send('Missing parameters. Required parameters are: {senderEmail, recipientEmail, amount}');
        return;
    }
    const senderEmail = req.body.senderEmail.toLowerCase();
    const amount = Number(req.body.amount);
    const recipientEmail = req.body.recipientEmail.toLowerCase();

    if (!amount || amount < 0) {
        res.status(400).send(`Error in parameter "number". Must be a positive number but received ${req.body.amount}`);
        return;
    }
    if (senderEmail === recipientEmail) {
        res.status(400).send('Error: "senderEmail" and "recipientEmail" must be different');
    }

    // start a session in order for the user/transaction updates to be "atomic"
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get the sender and recipient accounts
        const sender = await UserModel.findOne({ email: senderEmail }).session(session);
        const recipient = await UserModel.findOne({ email: recipientEmail }).session(session);

        if (!sender) res.status(404).send(`Error fetching user with email: ${senderEmail}`);
        if (!recipient) res.status(404).send(`Error fetching user with email: ${recipientEmail}`);

        const sendTransaction: Transaction = {
            userId: sender,
            amount: amount,
            type: 'send',
            createdAt: new Date(),
        };

        const receiveTransaction: Transaction = {
            userId: recipient,
            amount: amount,
            type: 'receive',
            createdAt: new Date(),
        };

        const sendTransactionModel = new TransactionModel(sendTransaction);
        const receiveTransactionModel = new TransactionModel(receiveTransaction);

        await sendTransactionModel.save({ session });
        await receiveTransactionModel.save({ session });

        sender.balance -= amount;
        recipient.balance += amount;

        await sender.save();
        await recipient.save();

        await session.commitTransaction();
    } catch (error) {
        // if anything fails above just rollback the changes here
        // this will rollback any changes made in the database
        await session.abortTransaction();

        // logging the error
        console.error(error);

        // rethrow the error
        res.status(404).send(error);
        // throw error;
    } finally {
        // ending the session
        session.endSession();
    }
    res.send('Transaction succesful');
};
