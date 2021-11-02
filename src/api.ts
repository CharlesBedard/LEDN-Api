import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { populateDatabase, MONGOOSE_URI } from './scripts/populate_db';
import { UserModel, TransactionModel, Transaction } from './schemas/schemas';

const app = express();
const jsonParser = bodyParser.json();
const port = 3000;

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

app.post('/populate-db', async (req, res) => {
    try {
        const r = await populateDatabase(req.query.sampleType.toString());
        res.send(r);
    } catch (err) {
        res.send({ error: err });
    }
});

app.get('/accounts', async (req, res) => {
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

app.get('/users', async (req, res) => {
    const user = await UserModel.findOne({ email: req.query.email.toString() }).lean();
    const transactions = await TransactionModel.find({}).where({ userId: user._id });
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
    res.send(stringUser);
});

app.post('/transactions', jsonParser, async (req, res) => {
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

    // construct transaction object from request
    let user;
    try {
        user = await UserModel.findOne({ email: emailParam }).lean();
    } catch (err) {
        res.status(404).send(`Error fetching user with email: ${emailParam}`);
    }
    const transaction: Transaction = {
        userId: user,
        amount: amountParam,
        type: typeParam,
        createdAt: new Date(),
    };

    const transactionObj = new TransactionModel(transaction);
    let transactionResponse;
    try {
        transactionResponse = await transactionObj.save();
    } catch (err) {
        res.status(404).send(`Error creating transaction: ${err}`);
    }

    res.send({ message: 'Succesfully created transaction', transaction: transactionResponse });
});
