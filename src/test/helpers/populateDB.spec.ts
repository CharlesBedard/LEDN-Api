import * as dbHelper from '../../helpers/populateDB';
import { TRANSACTIONS_INPUT } from '../testFixtures';

describe('Tests for populateDB helpers', () => {
    test('getMapFromTransactions', () => {
        const transactionMap = dbHelper.getMapFromTransactions(TRANSACTIONS_INPUT);
        expect(transactionMap.size).toEqual(3);
        expect(transactionMap.get('1').length).toEqual(2);
        expect(transactionMap.get('1')[0]).toMatchObject(TRANSACTIONS_INPUT[0]);
        expect(transactionMap.get('2').length).toEqual(1);
        expect(transactionMap.get('3').length).toEqual(1);
    });
    test('getBalanceFromTransactionArray', () => {
        const balance = dbHelper.getBalanceFromTransactionArray(TRANSACTIONS_INPUT);
        expect(balance).toEqual(0);
    });
});
