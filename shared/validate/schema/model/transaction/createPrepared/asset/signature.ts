import { TransactionType } from 'shared/model/transaction';
import { ASSET_TRS_SIGNATURE } from 'shared/validate/schema/model/transaction/create/asset/signature';

export const ASSET_PREPARED_TRS_SIGNATURE = [
    {...ASSET_TRS_SIGNATURE[0], id: `ASSET_PREPARED.${TransactionType.SIGNATURE}`}
];
