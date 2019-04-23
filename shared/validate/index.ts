import ZSchema from 'shared/validate/z_schema';
import Validator from 'z-schema';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { ALL_SCHEMAS, MESSAGE } from 'shared/validate/schema/init';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { Message2 } from 'shared/model/message';

/**
 * Compile all schemas for validate
 */
const validator: Validator = new ZSchema({
    noTypeless: true,
    noExtraKeywords: true,
    noEmptyArrays: true,
    noEmptyStrings: true
});
const isSchemasValid: boolean = validator.validateSchema(ALL_SCHEMAS);
logger.debug('[API][SCHEMAS] VALID:', isSchemasValid);

/**
 * Decorator for validate request
 */
export const validate = () => {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        let descriptorFn = descriptor.value || descriptor.get();

        return {
            value: (message, socket): any => {
                let schemaID = message.code;
                if (schemaID === API_ACTION_TYPES.CREATE_TRANSACTION && message.body && message.body.trs) {
                    schemaID = `CREATE_TRANSACTION.${message.body.trs.type}`;
                }
                if (schemaID === API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION && message.body) {
                    schemaID = `CREATE_PREPARED_TRANSACTION.${message.body.type}`;
                }
                validateData(MESSAGE(schemaID), message, (err: Validator.SchemaError, isValid: boolean) => {
                    if (!isValid) {
                        message.body = new ResponseEntity({
                            errors: [`IS NOT VALID REQUEST:'${message.code}'... ${err.message}`]
                        });
                        return handlerError.call(this, message, socket);
                    } else {
                        return descriptorFn.call(this, message, socket);
                    }
                });
            }
        };
    };
};

export const validateData = (schema, data: Object, callback) => {
    validator.validate(data, schema, (err: Array<Validator.SchemaError>, isValid: boolean) => {
        if (err) {
            callback(err[0], isValid);
            return;
        }
        callback(null, isValid);
    });
};

const handlerError = (message: Message2<any>, socket: any) => {
    logger.error(message.body.errors);
    socket.emit(MESSAGE_CHANNEL, message);
};
