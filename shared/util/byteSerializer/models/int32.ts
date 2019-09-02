import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 4;

export class Int32 extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Int32;
    }

    read(buffer, offset) {
        offset += this.length.type;
        return {
            value: buffer.readInt32BE(offset),
            offset: offset + this.length.body
        };
    }

    write(buffer, value: number, offset) {
        offset = this.writeTypeId(buffer, offset);
        return buffer.writeInt32BE(value, offset);
    }

    getLength() {
        return this.length.type + this.length.body;
    }
}
