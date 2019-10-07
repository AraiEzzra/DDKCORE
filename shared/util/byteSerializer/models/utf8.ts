import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const HEADER_LENGTH = 2;

export class Utf8 extends ModelType {
    constructor() {
        super();
        this.length.head = HEADER_LENGTH;
        this.typeId = BufferTypesId.Utf8;
    }

    getLength(value: string) {

        value = value || '';
        value = String(value);

        return this.length.type + this.length.head + Buffer.byteLength(value);
    }

    read(buffer, offset) {
        offset += this.length.type;
        const size = buffer.readUInt16BE(offset);
        offset += this.length.head;
        return {
            value: buffer.toString('utf8', offset, offset += size),
            offset: offset
        };
    }

    private writeHead(buffer: Buffer, bodyLength: number, offset: number): number {
        return buffer.writeUInt16BE(bodyLength, offset);
    }

    write(buffer, value: string, offset) {

        value = value || '';
        value = String(value);

        this.length.body = Buffer.byteLength(value);

        offset = this.writeTypeId(buffer, offset);

        offset = this.writeHead(buffer, this.length.body, offset);

        buffer.write(value, offset);
        return offset + this.length.body;
    }
}
