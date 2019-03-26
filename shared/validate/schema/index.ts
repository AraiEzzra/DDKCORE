import { SCHEMAS, SCHEMA_MESSAGE } from 'shared/validate/schema/message';
import { SCHEMAS_TRS } from 'shared/validate/schema/model/transaction/create';
import { SCHEMAS_GET_TRS } from 'shared/validate/schema/model/transaction/getTransaction';
import { SCHEMAS_GET_ACCOUNT } from 'shared/validate/schema/model/account';
import { SCHEMAS_GET_DELEGATE } from 'shared/validate/schema/model/delegate';
import { SCHEMAS_GET_BLOCK } from 'shared/validate/schema/model/block';
import { SCHEMAS_GET_REFERRED_USER } from 'shared/validate/schema/model/referredUser';
import { SCHEMAS_GET_REWARD } from 'shared/validate/schema/model/reward';

export const ALL_SCHEMAS = [].concat(
    SCHEMAS_TRS,
    SCHEMAS,
    SCHEMAS_GET_TRS,
    SCHEMAS_GET_ACCOUNT,
    SCHEMAS_GET_DELEGATE,
    SCHEMAS_GET_BLOCK,
    SCHEMAS_GET_REFERRED_USER,
    SCHEMAS_GET_REWARD
);
export const MESSAGE = SCHEMA_MESSAGE;
