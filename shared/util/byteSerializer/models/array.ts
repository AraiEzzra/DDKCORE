import { ModelType } from './modelType';
import { BufferTypesId, mapPrimitiveCode } from './../types';

const HEADER_LENGTH = 4;

export class BufferArray extends ModelType {
    private typeElement;

    constructor(type: ModelType) {
        super();
        this.length.head = HEADER_LENGTH;
        this.typeElement = type;
        this.typeId = BufferTypesId.BufferArray;
    }

    getLength(value: Array<any>): number {
        return this.length.type + this.length.type + this.length.head + this.getBodyLength(value);
    }

    private getBodyLength(value: Array<any>): number {
        return value.reduce((size, item) => {
            return size + this.typeElement.getLength(item);
        }, 0);
    }

    private writeArrayElementTypeId(buffer: Buffer, elementTypeId: number, offset: number): number {
        return buffer.writeUInt8(elementTypeId, offset);
    }

    private writeHead(buffer: Buffer, bodyLength: number, offset: number): number {
        return buffer.writeUInt32BE(bodyLength, offset);
    }

    read(buffer, offset) {

        offset += this.length.type;

        const elementPrimitiveTypeId = buffer.readUInt8(offset);
        offset += this.length.type;

        const sizeBody = buffer.readUInt32BE(offset);
        const ElementPrimitiveTypeId = mapPrimitiveCode.get(elementPrimitiveTypeId);
        this.typeElement = new ElementPrimitiveTypeId();

        offset += this.length.head;
        const res = [];

        const end = offset + sizeBody;

        while (offset < end) {
            const result = this.typeElement.read(buffer, offset);
            res.push(result.value);
            offset = result.offset;
        }

        return {
            value: res,
            offset: offset
        };
    }

    write(buffer, value: Array<any>, offset) {

        this.length.body = this.getBodyLength(value);
        offset = this.writeTypeId(buffer, offset);
        offset = this.writeArrayElementTypeId(buffer, this.typeElement.typeId, offset);

        offset = this.writeHead(buffer, this.length.body, offset);

        value.forEach(element => {
            offset = this.typeElement.write(buffer, element, offset);
        });

        return offset;
    }

}
