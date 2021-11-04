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

// Function to generate a map from transactions
// key: accountId
// value: array of all the transactions linked to the accountId
export function getMapFromTransactions(transactions: any[]): Map<any, any[]> {
    const transactionMap = new Map();
    for (const transaction of transactions) {
        if (transactionMap.has(transaction.accountId)) {
            transactionMap.get(transaction.accountId).push(transaction);
        } else {
            transactionMap.set(transaction.accountId, [transaction]);
        }
    }

    return transactionMap;
}

// Function to calculate an account's balance from a list of transactions
export function getBalanceFromTransactionArray(transactions: any[]) {
    let balance = 0;
    // sum up the transactions
    for (const transaction of transactions) {
        if (transaction.type === 'receive') {
            balance += transaction.amount;
        } else if (transaction.type === 'send') {
            balance -= transaction.amount;
        }
    }
    return balance;
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

    // loop through transactions to get the balance of every account
    try {
        // get a map where -> key: accountId, value: array of all transactions for accountId
        const transactionMap = getMapFromTransactions(transactionResponse);

        transactionMap.forEach(async (value, key) => {
            const balance = getBalanceFromTransactionArray(value);
            await AccountModel.findByIdAndUpdate(key, { balance }).catch((e) => {
                console.log(e);
            });
        });
    } catch (err) {
        console.log(`Unable to update account balances: ${err}`);
    }

    return response;
}
