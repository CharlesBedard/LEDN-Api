import * as schemas from '../../schemas';
import { ACCOUNT_FIXTURE } from '../testFixtures';

describe('Tests for schemas', () => {
    test('formatAccount', () => {
        const formattedAccount = schemas.formatAccount(ACCOUNT_FIXTURE);
        expect(formattedAccount._id).toBeNull;
        expect(formattedAccount._v).toBeNull;
        expect(formattedAccount.firstName).toEqual('Marianne');
    });
});
