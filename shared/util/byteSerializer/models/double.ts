import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 8;

export class Double extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Double;
    }

    read(buffer, offset) {
        offset += this.length.type;
        return {
            value: buffer.readDoubleBE(offset),
            offset: offset + this.length.body
        };
    }

    write(buffer, value: number, offset) {
        offset = this.writeTypeId(buffer, offset);
        return buffer.writeDoubleBE(value, offset);
    }

    getLength() {
        return this.length.type + this.length.body;
    }
}
