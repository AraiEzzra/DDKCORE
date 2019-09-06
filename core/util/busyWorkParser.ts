import { deserialize } from 'shared/util/byteSerializer';
import { SocketBufferRPC, SocketResponse, SocketResponseRPC } from 'shared/model/socket';

export class BusyWorkParser {
    parseJsonByte(response: Buffer | string): any {
        if (Buffer.isBuffer(response)) {
            return deserialize(response);
        } else {
            return JSON.parse(response);
        }
    }

    parseRPCRequest(str: Buffer | string): SocketResponseRPC {
        if (Buffer.isBuffer(str)) {
            const serializer = new SocketBufferRPC();
            return serializer.unpack(str);
        } else {
            return new SocketResponseRPC(str);
        }
    }

    parseBroadcast(str: Buffer | string): SocketResponse {
        if (Buffer.isBuffer(str)) {
            return deserialize(str);
        } else {
            return new SocketResponse(str);
        }
    }
}
