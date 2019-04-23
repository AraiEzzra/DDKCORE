import { TransactionType } from 'shared/model/transaction';
import { ASSET_TRS_DELEGATE } from 'shared/validate/schema/model/transaction/create/asset/delegate';

export const ASSET_PREPARED_TRS_DELEGATE = [
    {...ASSET_TRS_DELEGATE[0], id: `ASSET_PREPARED.${TransactionType.DELEGATE}`}
];
