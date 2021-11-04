import { UserModel, Transaction, TransactionModel } from '../schemas/schemas';
class AccountService {
    constructor() {}

    async getAccount(email: string) {
        // get the account from the email
        let user;
        try {
            user = await UserModel.findOne({ email }).lean();
        } catch (err) {
            throw new Error(`Error fetching user with email: ${email}`);
        }

        if (!user) throw new Error(`No account found for email: ${email}`);

        return user;
    }
}
export default new AccountService();
