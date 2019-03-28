import { COMPONENTS_TRS_SEND } from 'shared/validate/schema/model/transaction/create/send';
import { COMPONENTS_TRS_REGISTER } from 'shared/validate/schema/model/transaction/create/register';
import { COMPONENTS_TRS_SIGNATURE } from 'shared/validate/schema/model/transaction/create/signature';
import { COMPONENTS_TRS_DELEGATE } from 'shared/validate/schema/model/transaction/create/delegate';
import { COMPONENTS_TRS_STAKE } from 'shared/validate/schema/model/transaction/create/stake';
import { COMPONENTS_TRS_VOTE } from 'shared/validate/schema/model/transaction/create/vote';

export const SCHEMAS_TRS_ASSET = [
    COMPONENTS_TRS_SEND,
    COMPONENTS_TRS_REGISTER,
    COMPONENTS_TRS_SIGNATURE,
    COMPONENTS_TRS_DELEGATE,
    COMPONENTS_TRS_STAKE,
    COMPONENTS_TRS_VOTE
];
