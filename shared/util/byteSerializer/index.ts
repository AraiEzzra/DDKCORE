import { SchemaName } from 'shared/util/byteSerializer/config';
import { ModelType } from 'shared/util/byteSerializer/models/modelType';
import { BufferTypes } from 'shared/util/byteSerializer/types';

export function deserialize(buffer, offset = 0): any {
    const dynamicBuffer = new BufferTypes.Buffer();
    const data = dynamicBuffer.read(buffer, offset);
    return data.value;
}

export function createBufferObject(data, schema: SchemaName): Buffer {
    const object = new BufferTypes.Object(schema);
    return object.create(data);
}

export function createBufferArray(data: Array<any>, typeElement: ModelType): Buffer {
    const array = new BufferTypes.Array(typeElement);
    return array.create(data);
}

export function createBufferUtf8(data: string): Buffer {
    const utf8 = new BufferTypes.Utf8();
    return utf8.create(data);
}
