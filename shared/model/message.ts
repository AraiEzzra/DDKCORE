import uuidv4 from 'uuid/v4';

export enum MessageType {
    REQUEST = 1,
    RESPONSE,
    EVENT,
}

export class MessageModel {
    public code: string;
    public headers: {
        id: string;
        type: MessageType;
    };
    public body: Object;

    constructor(type: MessageType, code: string, body: Object, id? : string) {
        this.code = code;
        this.headers = {
            id: id || uuidv4(),
            type,
        };
        this.body = body;
    }
}

export default class Message extends MessageModel {

    public getId = (): string => this.headers.id;
    public getBody = (): any => this.body;
    public getCode = (): string => this.code;

    public serialize = (): MessageModel => {
        return {
            code: this.code,
            headers: this.headers,
            body: this.body,
        };
    };

    static deserialize = (message: MessageModel): Message => {
        return new Message(message.headers.type, message.code, message.body);
    }
}
