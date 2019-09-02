import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 2;

export class Uint16 extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Uint16;
    }

    read(buffer, offset) {
        offset += this.length.type;
        return {
            value: buffer.readUInt16BE(offset),
            offset: offset + this.length.body
        };
    }

    write(buffer, value: number, offset) {
        offset = this.writeTypeId(buffer, offset);
        return buffer.writeUInt16BE(value, offset);
    }

    getLength() {
        return this.length.type + this.length.body;
    }
}
