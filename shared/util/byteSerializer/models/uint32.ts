import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 4;

export class Uint32 extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Uint32;
    }

    read(buffer, offset) {
        offset += this.length.type;
        return {
            value: buffer.readUInt32BE(offset),
            offset: offset + this.length.body
        };
    }

    write(buffer, value: number, offset) {
        offset = this.writeTypeId(buffer, offset);
        return buffer.writeUInt32BE(value, offset);
    }

    getLength() {
        return this.length.type + this.length.body;
    }
}
