import { AccountModel } from '../schemas';

class AccountService {
    constructor() {}

    async getAccount(email: string) {
        // get the account from the email
        let account;
        try {
            account = await AccountModel.findOne({ email }).lean();
        } catch (err) {
            throw new Error(`Error fetching account with email: ${email}`);
        }

        if (!account) throw new Error(`No account found for email: ${email}`);

        return account;
    }
}
export default new AccountService();
