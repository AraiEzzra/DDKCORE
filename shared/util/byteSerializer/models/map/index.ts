import { ModelType } from './../modelType';
import { BufferTypesId, mapPrimitiveCode } from './../../types';
import { LocalSchema, MapObject } from './mapObject';
import { SimpleArray } from './simpleArray';

export class BufferMap extends ModelType {

    private typeElement;
    private key: ModelType;
    private val: ModelType;

    constructor(key?: ModelType, val?: ModelType) {
        super();
        this.typeId = BufferTypesId.BufferMap;
        this.key = key;
        this.val = val;
        this.typeElement = new SimpleArray(new MapObject(key, val));
    }

    getLength(data: Map<any, any>) {
        const arr = [...data].map(([key, val]) => ({ key, val }));
        const size = this.length.type + this.length.type + this.length.type + this.typeElement.getLength(arr);
        return size;
    }

    read(buffer, offset) {
        offset += this.length.type;

        const keyPrimitiveTypeId = buffer.readUInt8(offset);
        offset += this.length.type;
        const KeyPrimitive = mapPrimitiveCode.get(keyPrimitiveTypeId);

        const valuePrimitiveTypeId = buffer.readUInt8(offset);
        offset += this.length.type;

        const ValuePrimitive = mapPrimitiveCode.get(valuePrimitiveTypeId);
        this.typeElement = new SimpleArray(new MapObject(new KeyPrimitive(), new ValuePrimitive()));

        const result = this.typeElement.read(buffer, offset);

        const array = result.value.map(({ key, val }) => ([key, val]));

        return {
            value: new Map(array),
            offset: result.offset
        };
    }

    private writeTypes(buffer, offset): number {
        offset = buffer.writeUInt8(this.key.typeId, offset);
        return buffer.writeUInt8(this.val.typeId, offset);
    }

    write(buffer, data: Map<any, any>, offset) {
        offset = this.writeTypeId(buffer, offset);
        offset = this.writeTypes(buffer, offset);
        const arr = [...data].map(([key, val]) => new LocalSchema(key, val));
        return this.typeElement.write(buffer, arr, offset);
    }
}
