import ZSchema from 'shared/validate/z_schema';
import Validator from 'z-schema';
const validator: Validator = new ZSchema({});

/**
 * Decorator for validate request
 * @param schemaValid
 */
export const validate = (schemaValid: Object) => {
    return function ( target: any, propertyName: string, descriptor: PropertyDescriptor) {
        let descriptorFn = descriptor.value || descriptor.get();

        return {
            value: function (message) {
                validateData(schemaValid, message.body, (isValid: boolean) => {
                    message.isValid = isValid;
                    descriptorFn.apply(this, arguments);
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
