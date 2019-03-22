import { SCHEMAS, SCHEMA_MESSAGE } from 'shared/validate/schema/message';
import { SCHEMAS_TRS } from 'shared/validate/schema/model/transaction/create';
import { SCHEMAS_GET_TRS } from 'shared/validate/schema/model/transaction/getTransaction';

export const ALL_SCHEMAS = [].concat(
    SCHEMAS_TRS,
    SCHEMAS,
    SCHEMAS_GET_TRS
);
export const MESSAGE = SCHEMA_MESSAGE;
