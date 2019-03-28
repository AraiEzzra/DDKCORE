import { HEADER_MESSAGE, SCHEMA_MESSAGE } from 'shared/validate/schema/message';
import { SCHEMAS_TRS_ASSET } from 'shared/validate/schema/model/transaction/create';
import { SCHEMAS_TRANSACTIONS } from 'shared/validate/schema/model/transaction/getTransaction';
import { SCHEMAS_ACCOUNTS } from 'shared/validate/schema/model/account';
import { SCHEMAS_DELEGATES } from 'shared/validate/schema/model/delegate';
import { SCHEMAS_BLOCKS } from 'shared/validate/schema/model/block';
import { SCHEMA_REFERRED_USERS } from 'shared/validate/schema/model/referredUser';
import { SCHEMAS_REWARD } from 'shared/validate/schema/model/reward';
import { SCHEMAS_ROUND } from 'shared/validate/schema/model/round';

export const ALL_SCHEMAS = [].concat(
    SCHEMAS_TRS_ASSET,
    HEADER_MESSAGE,

    SCHEMAS_TRANSACTIONS,
    SCHEMAS_ACCOUNTS,
    SCHEMAS_BLOCKS,
    SCHEMAS_DELEGATES,
    SCHEMA_REFERRED_USERS,
    SCHEMAS_REWARD,
    SCHEMAS_ROUND
);

export const MESSAGE = SCHEMA_MESSAGE;
