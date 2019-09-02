import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 1;

export class Bool extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Bool;
    }

    read(buffer, offset) {
        offset += this.length.type;
        return {
            value: Boolean(buffer.readInt8(offset)),
            offset: offset + this.length.body
        };
    }

    write(buffer, value: boolean, offset) {
        offset = this.writeTypeId(buffer, offset);
        return buffer.writeUInt8(value === true ? 1 : 0, offset);
    }

    getLength(value) {
        return this.length.type + this.length.body;
    }
}
