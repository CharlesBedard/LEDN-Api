import { Schema, model } from 'mongoose';

const regexEmail =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

interface Account {
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

export const AccountSchema = new Schema<Account>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        balance: { type: Number, default: 0, required: true },
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
            match: regexEmail,
            lowercase: true,
        },
        dob: { type: Date, required: true },
        mfa: { type: String, enum: [null, 'TOTP', 'SMS'], required: false },
        createdAt: { type: Date, required: true },
        updatedAt: { type: Date, required: true },
        referredBy: { type: String, required: false, lowercase: true, match: regexEmail, trim: true },
    },
    { optimisticConcurrency: true },
);

export interface Transaction {
    accountId: Account;
    amount: number;
    type: string;
    admin: boolean;
    createdAt: Date;
}

const TransactionSchema = new Schema<Transaction>(
    {
        accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        amount: { type: Number, required: true },
        admin: { type: Boolean, default: false },
        type: { type: String, enum: ['send', 'receive'], required: true },
        createdAt: { type: Date, required: false },
    },
    { optimisticConcurrency: true },
);

export const AccountModel = model<Account>('Account', AccountSchema);
export const TransactionModel = model<Transaction>('Transaction', TransactionSchema);
