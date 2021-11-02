import { Schema, model, connect, Mongoose, Collection, connection } from 'mongoose';
import { UserModel, TransactionModel } from '../schemas/schemas';
import RawUsersLarge from '../../sample_data/accounts-api-large.json';
import RawTransactionsLarge from '../../sample_data/transactions-api-large.json';
import RawUsersSmall from '../../sample_data/accounts-api.json';
import RawTransactionsSmall from '../../sample_data/transactions-api.json';

export const MONGOOSE_URI = 'mongodb://root:rootpassword@mongodb:27017/ledn?authSource=admin';

export enum SampleDataType {
    small,
    large,
}

interface populateDbResponse {
    insertedUsers: number;
    userErrors: number;
    insertedTransactions: number;
    transactionErrors: number;
}

main();

function main() {
    connect(MONGOOSE_URI);
    connection.on('error', (err) => {
        console.log('err', err);
        setTimeout(() => {
            connect(MONGOOSE_URI);
        }, 5000);
    });
    connection.on('connected', async (err, res) => {
        console.log('mongoose is connected');
        await populateDatabase();
        process.exit(0);
    });
}

async function populateDatabase() {
    if (!(RawTransactionsLarge instanceof Array)) throw new Error('Error loading sample data');
    // fetch the sample data: small or large datasets
    let rawUserData = RawTransactionsSmall;
    let rawTransactionData = RawTransactionsLarge;

    const response: populateDbResponse = {
        insertedUsers: 0,
        userErrors: 0,
        insertedTransactions: 0,
        transactionErrors: 0,
    };
    // delete existing documents
    await UserModel.deleteMany({});
    await TransactionModel.deleteMany({});

    // populate users
    let insertedUsers = [];
    try {
        insertedUsers = await UserModel.insertMany(rawUserData, { ordered: false });
    } catch (err) {
        insertedUsers = err.insertedDocs;
        console.log(`inserted users: ${err?.result?.nInserted}`);
        console.log(`errors: ${err?.result?.result?.writeErrors}`);
        response.userErrors = err?.result?.result?.writeErrors?.length;
    }
    response.insertedUsers = insertedUsers.length;

    // populate transactions
    // reuse the inserted users if possible, otherwise fetch them from the db
    const users = insertedUsers ? insertedUsers : await UserModel.find({});
    const userMap = new Map();
    users.forEach((user: any) => {
        userMap.set(user.email.toLowerCase(), user);
    });
    // loop through the transactions to insert the userID instead of the email
    const transactions: any[] = rawTransactionData;
    for (const transaction of transactions) {
        transaction.userId = userMap.get(transaction.userEmail.toLowerCase())._id;
        delete transaction.userEmail;
    }
    try {
        const transactionResponse = await TransactionModel.insertMany(transactions, { ordered: false });
        console.log(`inserted transactions: ${transactionResponse.length}`);
        response.insertedTransactions = transactionResponse.length;
    } catch (err) {
        console.log(`inserted documents: ${err?.result?.nInserted}`);
        console.log(`errors: ${err?.result?.result?.writeErrors}`);
        response.transactionErrors = err?.result?.result?.writeErrors?.length;
    }

    return response;
}
