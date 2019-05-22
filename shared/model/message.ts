import uuidv4 from 'uuid/v4';
import { API_ACTION_TYPES, EVENT_TYPES } from 'shared/driver/socket/codes';

export enum MessageType {
    REQUEST = 1,
    RESPONSE = 2,
    EVENT = 3,
}

export class Message<MessageBody> {
    public code: EVENT_TYPES | API_ACTION_TYPES;
    public headers: {
        id: string;
        type: MessageType;
    };
    public body: MessageBody;

    constructor(type: MessageType, code: EVENT_TYPES | API_ACTION_TYPES, body: any, id? : string) {
        this.code = code;
        this.headers = {
            id: id || uuidv4(),
            type,
        };
        this.body = body;
    }
}
