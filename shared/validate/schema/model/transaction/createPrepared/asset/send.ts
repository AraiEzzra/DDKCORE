import { TransactionType } from 'shared/model/transaction';
import { ASSET_TRS_SEND } from 'shared/validate/schema/model/transaction/create/asset/send';

export const ASSET_PREPARED_TRS_SEND = [
    {...ASSET_TRS_SEND[0], id: `ASSET_PREPARED.${TransactionType.SEND}`}
];
