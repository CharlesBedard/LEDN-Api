import { Schema, model } from 'mongoose';

const regex_email =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// User
// * `firstName` (Account Holder First Name)
// * `lastName` (Account Holder Last Name)
// * `country` (Country code)
// * `email` (Account Holder email, unique)
// * `dob` (Account Holder Date of Birth)
// * `mfa` (multi factor authentication possible values: [null, 'TOTP', 'SMS'])
// * `createdAt` (Account creation date)
// * `updatedAt` (Account update date)
// * `referredBy` (email of referral account)
interface User {
    _id: Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    balance: number;
    country: string;
    email: string;
    dob: Date;
    mfa: string;
    createdAt: Date;
    updatedAt: Date;
    referredBy: string;
}

export const UserSchema = new Schema<User>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        balance: { type: Number, default: 0 },
        country: {
            type: String,
            required: true,
            match: /^[A-Z]{2}$/,
            uppercase: true,
            minLength: 2,
            maxLength: 2,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            index: true,
            required: true,
            match: regex_email,
            lowercase: true,
        },
        dob: { type: Date, required: true },
        mfa: { type: String, enum: [null, 'TOTP', 'SMS'], required: false },
        createdAt: { type: Date, required: true },
        updatedAt: { type: Date, required: true },
        referredBy: { type: String, required: false, lowercase: true, match: regex_email, trim: true },
    },
    { optimisticConcurrency: true },
);

// Transaction
// * `userEmail` (Account Holder Email)
// * `amount` (Number of tokens in transaction)
// * `type` (Possible values: ['send', 'receive'])
// * `createdAt` (Transaction creation date)
export interface Transaction {
    userId: User;
    amount: number;
    type: string;
    createdAt: Date;
}

const transactionSchema = new Schema<Transaction>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['send', 'receive'], required: true },
    createdAt: { type: Date, required: false },
});

export const UserModel = model<User>('User', UserSchema);
export const TransactionModel = model<Transaction>('Transaction', transactionSchema);
