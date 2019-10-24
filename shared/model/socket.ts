import { Utf8 } from 'shared/util/byteSerializer/models/utf8';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferObject, createBufferUtf8, deserialize } from 'shared/util/byteSerializer';

const utf8 = new Utf8();

type SocketResponse = {
    code: string;
    data: any;
};

type SocketResponseRPC = SocketResponse & {
    requestId: string;
};

export class SocketBufferRPC {
    static instance: SocketBufferRPC;

    constructor() {
        if (SocketBufferRPC.instance) {
            return SocketBufferRPC.instance;
        }
        SocketBufferRPC.instance = this;
    }

    pack(code: string, data: Buffer, requestId: string): Buffer {
        const head = createBufferUtf8(requestId);
        const body = createBufferObject({ code, data }, SchemaName.Request);

        return Buffer.concat([head, body]);
    }

    getRequestId(buffer: Buffer): string {
        return utf8.read(buffer, 0).value;
    }

    unpack(buffer: Buffer): SocketResponseRPC {
        const { offset, value: requestId } = utf8.read(buffer, 0);
        const data = deserialize(buffer, offset);
        return { ...data, requestId };
    }
}
