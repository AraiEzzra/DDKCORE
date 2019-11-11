import { SchemaName } from 'shared/util/byteSerializer/config';
import { ModelType } from 'shared/util/byteSerializer/models/modelType';
import { BufferTypes } from 'shared/util/byteSerializer/types';
import { logger } from 'shared/util/logger';

export function deserialize(buffer: Buffer, offset = 0): any {
    try {
        const dynamicBuffer = new BufferTypes.Buffer();
        const data = dynamicBuffer.read(buffer, offset);
        return data.value;
    } catch (e) {
        logger.error(`[ByteSerializer][deserialize] error ${e.stack}, Buffer: ${bufferToString(buffer)}`);
    }
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

export const bufferToString = (buffer: Buffer): string => {
    let arr = [];
    for (let ii = 0; ii < buffer.length; ii++) {
        let temp = buffer[ii].toString(16);
        if (temp.length === 0) {
            temp = '00';
        } else if (temp.length === 1) {
            temp = '0' + temp;
        }
        arr.push(temp);
    }
    return `[${arr.join(' ')}]`;
};
