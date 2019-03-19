import { Subject } from 'rxjs';
import { logger } from 'shared/util/logger';
import Timeout = NodeJS.Timeout;

export const subjectOn = new Subject();
export const subjectRpc = new Subject();
const tasks: { [topicName: string]: Timeout } = {};

export function messageON(topicName: string, data: any) {
    logger.debug(`[Bus][messageON] topicName ${topicName}, data: ${data}`);

    subjectOn.next({ data, topicName });
}

export function messageRPC(topicName: string, data: any) {
    logger.debug(`[Bus][messageRPC] topicName ${topicName}, data: ${data}`);

    subjectRpc.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null) {
    // todo implement function to create schedule fro messageON
    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${callTime}, data: ${data}`);

    if (tasks[topicName]) {
        logger.debug(`[Bus][createTaskON] topicName ${topicName}, the timer has been stopped`);
        clearTimeout(tasks[topicName]);
    }
    tasks[topicName] = setTimeout(() => {
        messageON(topicName, data);
        delete tasks[topicName];
    }, callTime);
}

export function resetTaskON(topicName): void {
    clearTimeout(tasks[topicName]);
    logger.debug(`[Bus][resetTaskON] topicName ${topicName}, the timer has been stopped`);
}
