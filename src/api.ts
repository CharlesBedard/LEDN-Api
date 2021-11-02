import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { populateDatabase, SampleDataType, MONGOOSE_URI } from './scripts/populate_db';
import { UserModel, TransactionModel } from './schemas/schemas';

const app = express();
const jsonParser = bodyParser.json();
const port = 3000;

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

app.put('/transactions', jsonParser, async (req, res) => {
    res.send(req.body);
});
