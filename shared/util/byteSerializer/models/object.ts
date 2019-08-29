import { ModelType } from './modelType';
import { schemaStore } from './../schema';
import { BufferTypesId } from './../types';

const HEADER_LENGTH = 1;

export class BufferObject extends ModelType {

    private schemaName;

    constructor(schemaName) {
        super();
        this.length.head = HEADER_LENGTH;
        this.typeId = BufferTypesId.BufferObject;
        this.schemaName = schemaName;
    }

    getLength(object): number {
        const bufferSize = this.length.type + this.length.head;
        const schema = schemaStore.get(this.schemaName);

        return Object.keys(schema).reduce((size, key) => {
            return size + schema[key].getLength(object[key]);
        }, bufferSize);
    }


    read(buffer, offset) {

        const value = {};
        offset += this.length.type;
        const schemaId = buffer.readUInt8(offset);
        offset += this.length.head;

        const schema = schemaStore.get(schemaId);

        Object.keys(schema).sort().forEach((key) => {

            if (offset >= buffer.length) {
                console.error(`[ByteSerializer][Object] offset: ${offset} >= buffer: ${buffer.length}`);
                return;
            }
            const data = schema[key].read(buffer, offset);
            offset = data.offset;
            value[key] = data.value;
        });
        return {
            value,
            offset
        };
    }

    private writeHead(buffer: Buffer, schemaId: number, offset: number): number {
        return buffer.writeUInt8(schemaId, offset);
    }

    write(buffer, object, offset) {

        const schemaId = this.schemaName;

        offset = this.writeTypeId(buffer, offset);
        offset = this.writeHead(buffer, schemaId, offset);

        const schema = schemaStore.get(schemaId);
        Object.keys(schema).sort().forEach((key) => {
            offset = schema[key].write(buffer, object[key], offset);
        });
        return offset;
    }

}
