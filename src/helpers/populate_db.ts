import { AccountModel, TransactionModel } from '../schemas';
import RawAccountsLarge from '../../sample_data/accounts-api-large.json';
import RawTransactionsLarge from '../../sample_data/transactions-api-large.json';
import RawAccountsSmall from '../../sample_data/accounts-api.json';
import RawTransactionsSmall from '../../sample_data/transactions-api.json';

export const MONGOOSE_URI = 'mongodb://mongodb:27017/ledn';

export enum SampleDataType {
    small,
    large,
}

interface populateDbResponse {
    insertedAccounts: number;
    accountErrors: number;
    insertedTransactions: number;
    transactionErrors: number;
}

export function mapTransactions() {
    return 5;
}

export async function populateDatabase(type: string) {
    if (!(RawTransactionsLarge instanceof Array)) throw new Error('Error loading sample data');
    // fetch the sample data: small or large datasets
    let rawAccountData = [];
    let rawTransactionData = [];
    switch (type) {
        case SampleDataType[SampleDataType.small]:
            rawAccountData = RawAccountsSmall;
            rawTransactionData = RawTransactionsSmall;
            break;
        case SampleDataType[SampleDataType.large]:
            rawAccountData = RawAccountsLarge;
            rawTransactionData = RawTransactionsLarge;
            break;
        default:
            throw new Error('Invalid sampla database type. Options are: [small, large]');
    }

    const response: populateDbResponse = {
        insertedAccounts: 0,
        accountErrors: 0,
        insertedTransactions: 0,
        transactionErrors: 0,
    };
    // delete existing documents
    await AccountModel.deleteMany({});
    await TransactionModel.deleteMany({});
    console.log('Account and Transaction collections cleared');

    // populate accounts
    let insertedAccounts = [];
    try {
        insertedAccounts = await AccountModel.insertMany(rawAccountData, { ordered: false });
    } catch (err) {
        insertedAccounts = err.insertedDocs;
        console.log(`inserted users: ${err?.result?.nInserted}`);
        console.log(`errors: ${err?.result?.result?.writeErrors}`);
        response.accountErrors = err?.result?.result?.writeErrors?.length;
    }
    response.insertedAccounts = insertedAccounts.length;

    // populate transactions
    // reuse the inserted users if possible, otherwise fetch them from the db
    const users = insertedAccounts || (await AccountModel.find({}));
    const userMap = new Map();
    users.forEach((user: any) => {
        userMap.set(user.email.toLowerCase(), user);
    });
    // loop through the transactions to insert the userID instead of the email
    const transactions: any[] = rawTransactionData;
    for (const transaction of transactions) {
        transaction.accountId = userMap.get(transaction.userEmail.toLowerCase())._id;
        delete transaction.userEmail;
    }
    let transactionResponse;
    try {
        transactionResponse = await TransactionModel.insertMany(transactions, { ordered: false });
        console.log(`inserted transactions: ${transactionResponse.length}`);
        response.insertedTransactions = transactionResponse.length;
    } catch (err) {
        console.log(`inserted documents: ${err?.result?.nInserted}`);
        console.log(`errors: ${err?.result?.result?.writeErrors}`);
        response.transactionErrors = err?.result?.result?.writeErrors?.length;
    }

    // loop through transactions to get the balance of every user
    try {
        // create a map where -> key: userId, value: array of all transactions for userId
        const transactionMap = new Map();
        transactionResponse.forEach((transaction) => {
            if (transactionMap.has(transaction.accountId)) {
                transactionMap.get(transaction.accountId).push(transaction);
            } else {
                transactionMap.set(transaction.accountId, [transaction]);
            }
        });

        transactionMap.forEach((value, key) => {
            // sum up the transactions
            let balance = 0;
            value.forEach((transaction: { type: string; amount: number }) => {
                if (transaction.type === 'receive') {
                    balance += transaction.amount;
                } else if (transaction.type === 'send') {
                    balance -= transaction.amount;
                }
            });
            AccountModel.findByIdAndUpdate(key, { balance }).catch((e) => {
                console.log(e);
            });
        });
    } catch (err) {
        console.log(`Unable to update account balances: ${err}`);
    }

    return response;
}
