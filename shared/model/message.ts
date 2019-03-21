import uuidv4 from 'uuid/v4';

export enum MessageType {
    REQUEST = 1,
    RESPONSE,
    EVENT,
}

export class Message {
    public code: string;
    public headers: {
        id: string;
        type: MessageType;
    };
    public body: any;

    constructor(type: MessageType, code: string, body: any, id? : string) {
        this.code = code;
        this.headers = {
            id: id || uuidv4(),
            type,
        };
        this.body = body;
    }
}

export class Message2<MessageBody> {
    public code: string;
    public headers: {
        id: string;
        type: MessageType;
    };
    public body: MessageBody;

    constructor(type: MessageType, code: string, body: any, id? : string) {
        this.code = code;
        this.headers = {
            id: id || uuidv4(),
            type,
        };
        this.body = body;
    }
}
