import { SCHEMAS, SCHEMA_MESSAGE } from 'shared/validate/schema/message';
import { SCHEMAS_TRS } from 'shared/validate/schema/model/transaction';

export const ALL_SCHEMAS = [].concat(
    SCHEMAS_TRS,
    SCHEMAS
);
export const MESSAGE = SCHEMA_MESSAGE;
