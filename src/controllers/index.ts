import { populateDatabase } from '../helpers/populate_db';
import AccountService from '../services/accountService';
import TransactionService from '../services/transactionService';

enum TransactionTypes {
    'credit',
    'debit',
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

        return res.send(account);
    } catch (err) {
        return res.status(400).send(err);
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
        return res.send(dbStats);
    } catch (err) {
        return res.status(400).send({ Error: err });
    }
};

export const postTransaction = async (req: any, res: any) => {
    try {
        // validate body
        if (!(req.body.email && req.body.amount && req.body.type))
            return res.status(400).send('Missing parameters. Required parameters are: {email, amount, type}');
        const email = req.body.email.toLowerCase();
        const amount = Number(req.body.amount);
        const type = req.body.type.toLowerCase();

        if (!amount)
            return res
                .status(400)
                .send(`Error in parameter "number". Must be a number but received ${req.body.amount}`);
        if (!Object.values(TransactionTypes).includes(type)) {
            return res
                .status(400)
                .send(`Error in parameter "type". Valid options are { credit, debit }, but received: ${req.body.type}`);
        }

        await TransactionService.createTransactionWithAccountUpdate(email, amount, type);

        return res.send('Succesfully created transaction and updated account');
    } catch (err) {
        return res.status(400).send(err);
    }
};

export const postTransfer = async (req: any, res: any) => {
    try {
        // validate body
        if (
            !(req.body.senderEmail && req.body.recipientEmail && req.body.amount) &&
            req.body.amount !== 0 &&
            req.body.amount !== '0'
        ) {
            return res
                .status(400)
                .send('Missing parameters. Required parameters are: {senderEmail, recipientEmail, amount}');
        }
        const senderEmail = req.body.senderEmail.toLowerCase();
        const amount = Number(req.body.amount);
        const recipientEmail = req.body.recipientEmail.toLowerCase();

        if (!amount || amount <= 0) {
            return res
                .status(400)
                .send(
                    `Error in parameter "number". Must be a positive number greater than 0 but received ${req.body.amount}`,
                );
        }
        if (senderEmail === recipientEmail) {
            return res.status(400).send('Error: "senderEmail" and "recipientEmail" must be different');
        }

        await TransactionService.createTransferWithAccountUpdates(senderEmail, recipientEmail, amount);

        return res.send('Succesfully created transfer and updated accounts');
    } catch (err) {
        return res.status(400).send(err);
    }
};
