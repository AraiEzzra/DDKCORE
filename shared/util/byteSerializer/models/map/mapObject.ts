import { ModelType } from './../modelType';

export class LocalSchema {

    private key: ModelType;
    private val: ModelType;

    constructor(key: ModelType, val: ModelType) {
        this.key = key;
        this.val = val;
    }
}

export class MapObject extends ModelType {

    private localSchema: LocalSchema;

    constructor(key: ModelType, value: ModelType) {
        super();
        this.localSchema = new LocalSchema(key, value);
    }

    getLength(object): number {
      return  Object.keys(this.localSchema).reduce((size, key) => {
           return size + this.localSchema[key].getLength(object[key]);
        }, 0);
    }

    read(buffer, offset) {

        const value = {};

        Object.keys(this.localSchema).sort().forEach((key) => {
            const data = this.localSchema[key].read(buffer, offset);
            offset = data.offset;
            value[key] = data.value;
        });
        return {
            value,
            offset
        };
    }

    write(buffer, object, offset) {

        Object.keys(this.localSchema).sort().forEach((key) => {
            offset = this.localSchema[key].write(buffer, object[key], offset);
        });
        return offset;
    }
}
