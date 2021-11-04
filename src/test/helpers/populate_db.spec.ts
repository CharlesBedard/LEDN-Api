import * as k from '../../helpers/populate_db';

describe('Simple expression tests', () => {
    test('Check literal value', () => {
        expect(k.mapTransactions()).toEqual(5);
    });
});
