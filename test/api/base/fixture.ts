import { MessageType } from 'shared/model/message';

export class Fixture {

    static getBaseHeaders() {
        const id = Math.ceil(Math.random() * 100000).toString();
        return {
            id,
            type: MessageType.REQUEST
        };
    }
}
