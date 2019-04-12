import { logger } from 'shared/util/logger';
import { messageON, messageRPC } from 'shared/util/bus';

interface IEvent {
    data: any;
    topicName: string;
    type: string;
}

class EventQueue {
    pool: Array<IEvent>;

    constructor() {
        this.pool = [];
    }

    push(data: IEvent) {
        logger.debug(`[Repository][EventQueue][push]: TopicName ${data.topicName}, length: ${this.pool.length}`);
        this.pool.unshift(data);
    }

    process() {
        while (this.pool.length > 0) {
            const event = this.pool.pop();
            logger.debug(`[Repository][EventQueue][process]: run ${event.topicName}, ${this.pool.length}`);
            switch (event.type) {
                case 'ON':
                    messageON(event.topicName, event.data);
                    break;
                case 'RPC':
                    messageRPC(event.topicName, event.data);
                    break;
                default:
                    break;
            }
        }
    }
}

export default new EventQueue();
