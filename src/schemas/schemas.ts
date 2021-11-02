import { Schema, model } from 'mongoose';

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
    country: string;
    email: string;
    dob: Date;
    mfa: string;
    createdAt: Date;
    updatedAt: Date;
    referredBy: string;
}

export const UserSchema = new Schema<User>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    country: { type: String, required: true, validate: /^[A-Z]{2}$/ },
    email: {
        type: String,
        unique: true,
        index: true,
        required: true,
        validate:
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        lowercase: true,
    },
    dob: { type: Date, required: true },
    mfa: { type: String, enum: [null, 'TOTP', 'SMS'], required: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    referredBy: { type: String, required: false, lowercase: true },
});

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
