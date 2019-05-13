import { Subject } from 'rxjs';
import { logger } from 'shared/util/logger';
import Timeout = NodeJS.Timeout;

export const subjectOn = new Subject();
export const subjectRpc = new Subject();
const tasks: Map<string, Timeout> = new Map();

export function messageON(topicName: string, data: any = {}) {
    logger.trace(`[Bus][messageON] topicName ${topicName}`);

    subjectOn.next({ data, topicName });
}

export function messageRPC(topicName: string, data: any) {
    logger.debug(`[Bus][messageRPC] topicName ${topicName}`);

    subjectRpc.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null) {
    // todo implement function to create schedule fro messageON
    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${callTime}`);

    if (tasks.get(topicName)) {
        logger.debug(`[Bus][createTaskON] topicName ${topicName}, the timer has been stopped`);
        clearTimeout(tasks.get(topicName));
    }
    tasks.set(topicName, setTimeout(() => {
        messageON(topicName, data);
        tasks.delete(topicName);
    }, callTime) as Timeout);
}

export function resetTaskON(topicName: string): void {
    if (tasks.get(topicName)) {
        clearTimeout(tasks.get(topicName));
        logger.debug(`[Bus][resetTaskON] topicName ${topicName}, the timer has been stopped`);
    }
}
