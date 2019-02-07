import Validator from 'z-schema';
import ZSchema from 'shared/util/z_schema';
const validator: Validator = new ZSchema({});

export const validate = async (schema: Object, data: Object, method: string): Promise<boolean> => {
    let isValid: boolean = false;
    await validator.validate(data, schema, async (err, report: boolean) => {
        isValid = report;
    });
    return isValid;
};
