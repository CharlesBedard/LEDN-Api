import { populateDatabase } from '../scripts/populate_db';
import AccountService from '../services/accountService';
import TransactionService from '../services/transactionService';

enum TransactionTypes {
    'send',
    'receive',
}

export const getAccount = async (req: any, res: any) => {
    try {
        // validate parameters
        if (!req.query.email) {
            return res.status(400).send('Missing parameters. Required parameters are: {email}');
        }

        // get account
        const email = req.query.email.toString().toLowerCase();
        const account = await AccountService.getAccount(email);

        res.send(account);
    } catch (err) {
        res.status(400).send(err);
    }
};

export const postResetDb = async (req: any, res: any) => {
    try {
        // validate parameters
        if (!req.query.type) {
            return res.status(400).send('Missing parameter "type"');
        }
        const type = req.query.type.toString();
        const dbStats = await populateDatabase(type);
        res.send(dbStats);
    } catch (err) {
        res.status(400).send({ Error: err });
    }
};

export const postTransaction = async (req: any, res: any) => {
    try {
        // validate body
        if (!(req.body.email && req.body.amount && req.body.type))
            throw new Error('Missing parameters. Required parameters are: {email, amount, type}');
        const email = req.body.email.toLowerCase();
        const amount = Number(req.body.amount);
        const type = req.body.type.toLowerCase();

        if (!amount) throw new Error(`Error in parameter "number". Must be a number but received ${req.body.amount}`);
        if (!Object.values(TransactionTypes).includes(type)) {
            throw new Error(
                `Error in parameter "type". Valid options are { send, receive }, but received: ${req.body.type}`,
            );
        }

        await TransactionService.createTransactionWithAccountUpdate(email, amount, type);

        res.send('Succesfully created transaction and updated account');
    } catch (err) {
        res.status(400).send(err);
    }
};

export const postTransfer = async (req: any, res: any) => {
    try {
        // validate body
        if (!(req.body.senderEmail && req.body.recipientEmail && req.body.amount)) {
            throw new Error('Missing parameters. Required parameters are: {senderEmail, recipientEmail, amount}');
        }
        const senderEmail = req.body.senderEmail.toLowerCase();
        const amount = Number(req.body.amount);
        const recipientEmail = req.body.recipientEmail.toLowerCase();

        if (!amount || amount < 0) {
            throw new Error(`Error in parameter "number". Must be a positive number but received ${req.body.amount}`);
        }
        if (senderEmail === recipientEmail) {
            throw new Error('Error: "senderEmail" and "recipientEmail" must be different');
        }

        await TransactionService.createTransferWithAccountUpdates(senderEmail, recipientEmail, amount);

        res.send('Succesfully created transfer and updated accounts');
    } catch (err) {
        res.status(400).send(err);
    }
};
