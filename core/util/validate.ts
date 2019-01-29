import Validator from 'z-schema';
import * as schema from '../schema';
import ZSchema from '../../shared/util/z_schema';
const validator: Validator = new ZSchema({});

export const validate = async (nameSchema: string, data: Object, method: string): Promise<boolean> => {
    nameSchema = nameSchema.replace(/\//g, '');
    let isValid: boolean = false;
    await validator.validate(data, schema[nameSchema][method], async (err, report: boolean) => {
        isValid = report;
    });
    return isValid;
};
