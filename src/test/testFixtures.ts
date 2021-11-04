import mongoose from 'mongoose';
import { Account } from '../schemas';

export const TRANSACTIONS_INPUT = [
    {
        accountId: '1',
        amount: 1234,
        admin: false,
        type: 'send',
        createdAt: new Date('2021-11-12'),
        _id: '1',
        _v: 0,
    },
    {
        accountId: '1',
        amount: 2345,
        admin: false,
        type: 'receive',
        createdAt: new Date('2021-11-12'),
        _id: '2',
        _v: 0,
    },
    {
        accountId: '2',
        amount: 3456,
        admin: false,
        type: 'receive',
        createdAt: new Date('2021-11-12'),
        _id: '3',
        _v: 0,
    },
    {
        accountId: '3',
        amount: 4567,
        admin: false,
        type: 'send',
        createdAt: new Date('2021-11-12'),
        _id: '4',
        _v: 0,
    },
];

export const ACCOUNT_FIXTURE = {
    _id: '1',
    firstName: 'Marianne',
    lastName: 'Pagac',
    balance: 0,
    country: 'UY',
    email: 'lloyd_marvin74@gmail.com',
    dob: new Date('1990-01-23T09:07:59.209Z'),
    mfa: 'SMS',
    createdAt: new Date('2020-02-10T10:04:33.785Z'),
    updatedAt: new Date('2020-02-10T10:04:33.785Z'),
    referredBy: 'gillian.farrell@yahoo.com',
    _v: 0,
};
