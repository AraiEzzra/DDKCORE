import { TransactionType } from 'shared/model/transaction';
import { ASSET_TRS_REGISTER } from 'shared/validate/schema/model/transaction/create/asset/register';

export const ASSET_PREPARED_TRS_REGISTER = [
    {...ASSET_TRS_REGISTER[0], id: `ASSET_PREPARED.${TransactionType.REGISTER}`}
];
