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
const validator: Validator = new ZSchema({});
const isSchemasValid: boolean = validator.validateSchema(ALL_SCHEMAS);
logger.debug('[API][SCHEMAS] VALID:', isSchemasValid);

/**
 * Decorator for validate request
 */
export const validate = () => {
    return function ( target: any, propertyName: string, descriptor: PropertyDescriptor) {
        let descriptorFn = descriptor.value || descriptor.get();

        return {
            value: (message, socket): any => {
                let schemaID = message.code;
                if (schemaID === API_ACTION_TYPES.CREATE_TRANSACTION &&
                    listKeys(message).includes('body.trs.type')
                ) {
                    schemaID += '_' + message.body.trs.type;
                }
                validateData(MESSAGE(schemaID), message, (err, valid: boolean) => {
                    if (err) {
                        message.body = new ResponseEntity({
                            errors: [`IS NOT VALID REQUEST:'${ message.code }'... ${err.message}`]
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
    validator.validate(data, schema, (err, report: boolean) => {
        if (err) {
            callback(err[0], report);
            return;
        }
        callback(null, report);
    });
};

const handlerError = (message: Message2<any>, socket: any) => {
    logger.error(message.body.errors);
    socket.emit(MESSAGE_CHANNEL, message);
};

const listKeys = (data: Object) => {
    let listFields: Array<string> = Object.keys(data);

    for (let key in data) {
        if (typeof data[key] === 'object') {
            let subKeys = listKeys(data[key]);
            listFields = listFields.concat(subKeys.map((subkey) => key + '.' + subkey));
        }
    }
    return listFields;
};
