import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 1;

export class Uint8 extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Uint8;
    }

    read(buffer, offset) {
        offset += this.length.type;
        return {
            value: buffer.readUInt8(offset),
            offset: offset + this.length.body
        };
    }

    write(buffer, value: number, offset) {
        offset = this.writeTypeId(buffer, offset);
        return buffer.writeUInt8(value, offset);
    }

    getLength() {
        return this.length.type + this.length.body;
    }
}
