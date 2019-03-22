import { COMPONENTS_TRS_SEND } from 'shared/validate/schema/model/transaction/send';
import { COMPONENTS_TRS_REGISTER } from 'shared/validate/schema/model/transaction/register';
import { COMPONENTS_TRS_SIGNATURE } from 'shared/validate/schema/model/transaction/signature';
import { COMPONENTS_TRS_DELEGATE } from 'shared/validate/schema/model/transaction/delegate';
import { COMPONENTS_TRS_STAKE } from 'shared/validate/schema/model/transaction/stake';
import { COMPONENTS_TRS_VOTE } from 'shared/validate/schema/model/transaction/vote';

const SCHEMAS_TRANSACTION = [].concat(
    COMPONENTS_TRS_SEND,
    COMPONENTS_TRS_REGISTER,
    COMPONENTS_TRS_SIGNATURE,
    COMPONENTS_TRS_DELEGATE,
    COMPONENTS_TRS_STAKE,
    COMPONENTS_TRS_VOTE
);

export const SCHEMAS_TRS = [].concat(SCHEMAS_TRANSACTION);
