import ZSchema from 'shared/validate/z_schema';
import Validator from 'z-schema';
import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
const validator: Validator = new ZSchema({});

/**
 * Decorator for validate request
 * @param schemaValid
 */
export const validate = (schemaValid: Object) => {
    return function ( target: any, propertyName: string, descriptor: PropertyDescriptor) {
        let descriptorFn = descriptor.value || descriptor.get();

        return {
            value: (message, socket) => {
                validateData(schemaValid, message.body, (isValid: boolean) => {
                    if (!isValid) {
                        const error = new ResponseEntity({ errors: [`Request '${ message.code }' is not valid`]});
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

export const validateData = (schema: Object, data: Object, callback) => {
    validator.validate(data, schema, (err, report: boolean) => {
        callback(report);
    });
};

const handlerError = (data) => {
    logger.error(data.message);
    data.socket.emit(MESSAGE_CHANNEL, data.message);
};
