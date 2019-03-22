import ZSchema from 'shared/validate/z_schema';
import Validator from 'z-schema';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { ALL_SCHEMAS, MESSAGE } from 'shared/validate/schema';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

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
            value: (message, socket) => {
                let schemaID = message.code;
                if (schemaID === API_ACTION_TYPES.CREATE_TRANSACTION &&
                    Object.keys(message.body || [])
                        .concat(Object.keys(message.body.data || []))
                        .includes('trs')
                ) {
                    schemaID += '_' + message.body.data.trs.type;
                }
                validateData(MESSAGE(schemaID), message, (err, valid: boolean) => {
                    if (err) {
                        const error = new ResponseEntity({
                            errors: [`IS NOT VALID REQUEST:'${ message.code }'... ${err.message}`]
                        });
                        return handlerError.call(this, {
                            message: error,
                            socket
                        });
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

const handlerError = (data) => {
    logger.error(data.message);
    data.socket.emit(MESSAGE_CHANNEL, data.message);
};


