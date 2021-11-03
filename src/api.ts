import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { populateDatabase, MONGOOSE_URI } from './scripts/populate_db';
import { UserModel, TransactionModel, Transaction } from './schemas/schemas';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger/swagger.json';

const app = express();
const jsonParser = bodyParser.json();
const port = 3000;

const router = express.Router();
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

enum TransactionTypes {
    'send',
    'receive',
}

mongoose.connect(MONGOOSE_URI);
mongoose.connection.on('error', (err) => {
    console.log('err', err);
});
mongoose.connection.on('connected', (err, res) => {
    console.log('mongoose is connected');
});

app.listen(port, () => {
    console.log(`App is running, listening on port: ${port}`);
});

router.post('/populate-db', async (req, res) => {
    try {
        const r = await populateDatabase(req.query.sampleType.toString());
        res.send(r);
    } catch (err) {
        res.send({ error: err });
    }
});

router.get('/accounts', async (req, res) => {
    // validate parameters
    if (!req?.query?.email) res.status(400).send('Missing parameter: { email }');
    const requestedUserEmail = req.query.email.toString();

    // get user account from the userId
    let user;
    try {
        user = await UserModel.findOne({ email: requestedUserEmail }).lean();
    } catch (err) {
        res.status(404).send(`Error fetching user with email: ${requestedUserEmail}`);
    }

    // get transactions associated with user
    let transactions;
    try {
        transactions = await TransactionModel.find({}).where({ userId: user._id });
    } catch (err) {
        res.status(404).send(`Error fetching transactions for user with email: ${requestedUserEmail}`);
    }

    // calculate account balance
    let balance = 0;
    transactions.forEach((transaction) => {
        if (transaction.type === 'receive') {
            balance += transaction.amount;
        } else if (transaction.type === 'send') {
            balance -= transaction.amount;
        }
    });
    const stringUser = JSON.parse(JSON.stringify(user));
    stringUser.balance = balance;

    // TODO: add helper to format response
    res.send(stringUser);
});

router.get('/users', async (req, res) => {
    // validate parameters
    if (!(req.query.email || req.query.userId))
        res.status(400).send('Missing parameters. Required parameters are: {email}');
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
});

const waitFor = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

router.post('/transactions', jsonParser, async (req, res) => {
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
});

router.post('/transfers', jsonParser, async (req, res) => {
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
});

app.use('/api', router);
