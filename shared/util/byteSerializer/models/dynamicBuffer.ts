import { ModelType } from './modelType';
import { mapPrimitiveCode } from './../types';

export class DynamicBuffer extends ModelType {

    private typeElement;

    getLength(buffer: Buffer) {
        return buffer.length;
    }

    read(buffer, offset = 0) {

        const primitiveTypeId = buffer.readUInt8(offset);

        const Primitive = mapPrimitiveCode.get(primitiveTypeId);

        this.typeElement = new Primitive();

        const result = this.typeElement.read(buffer, offset);

        return {
            offset: result.offset,
            value: result.value
        };
    }

    write(buffer: Buffer, object: Buffer, offset) {
        object.copy(buffer, offset);
        return offset + object.length;
    }
}
