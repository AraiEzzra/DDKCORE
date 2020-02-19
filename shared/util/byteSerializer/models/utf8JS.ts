import { ModelType } from './modelType';
import { BufferTypesId } from './../types';
import JSSpecialTypes, { JSSpecialValues } from './specialTypes/jsType';

const HEADER_LENGTH = 2;

export class Utf8JS extends ModelType {

    constructor() {
        super();
        this.length.head = HEADER_LENGTH;
        this.typeId = BufferTypesId.Utf8JS;
    }

    getLength(value: string | JSSpecialValues) {

        if (JSSpecialTypes.has(value)) {
            return this.length.type + JSSpecialTypes.getLength();
        }

        value = String(value);

        return this.length.type + JSSpecialTypes.getLength() + this.length.head + Buffer.byteLength(value);
    }

    read(buffer, offset): {offset: number, value: string | JSSpecialValues} {
        offset += this.length.type;

        const data = JSSpecialTypes.read(buffer, offset);
        offset = data.offset;

        if (data.isSpecial) {
            return {
                value: data.value,
                offset,
            };
        }
        const size = buffer.readUInt16BE(offset);
        offset += this.length.head;
        return {
            value: buffer.toString('utf8', offset, offset += size),
            offset,
        };
    }

    private writeHead(buffer: Buffer, bodyLength: number, offset: number): number {
        return buffer.writeUInt16BE(bodyLength, offset);
    }

    write(buffer, value: string, offset) {

        offset = this.writeTypeId(buffer, offset);

        if (JSSpecialTypes.has(value)) {
            return JSSpecialTypes.write(buffer, value, offset);
        }
        offset += JSSpecialTypes.getLength();

        value = String(value);
        this.length.body = Buffer.byteLength(value);
        offset = this.writeHead(buffer, this.length.body, offset);

        buffer.write(value, offset);
        return offset + this.length.body;
    }
}
