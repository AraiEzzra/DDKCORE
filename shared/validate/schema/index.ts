import { SCHEMAS, SCHEMA_MESSAGE } from 'shared/validate/schema/message';
import { SCHEMAS_TRS } from 'shared/validate/schema/model/transaction/create';
import { SCHEMAS_GET_TRS } from 'shared/validate/schema/model/transaction/getTransaction';
import { SCHEMAS_GET_ACCOUNT } from 'shared/validate/schema/model/account';
import { SCHEMAS_GET_DELEGATE } from 'shared/validate/schema/model/delegate';
import { SCHEMAS_GET_BLOCK } from 'shared/validate/schema/model/block';

export const ALL_SCHEMAS = [].concat(
    SCHEMAS_TRS,
    SCHEMAS,
    SCHEMAS_GET_TRS,
    SCHEMAS_GET_ACCOUNT,
    SCHEMAS_GET_DELEGATE,
    SCHEMAS_GET_BLOCK
);
export const MESSAGE = SCHEMA_MESSAGE;
