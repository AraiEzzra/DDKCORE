import { Subject } from 'rxjs';
import { logger } from 'shared/util/logger';

export const subjectOn = new Subject();
export const subjectRpc = new Subject();
const tasks: Map<string, NodeJS.Timeout> = new Map();

export function messageON(topicName: string, data: any = {}): void {
    logger.trace(`[Bus][messageON] topicName ${topicName}`);

    subjectOn.next({ data, topicName });
}

export function messageRPC(topicName: string, data: any): void {
    logger.debug(`[Bus][messageRPC] topicName ${topicName}`);

    subjectRpc.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null, force: boolean = true): void {
    // todo implement function to create schedule fro messageON
    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${callTime}`);

    if (tasks.get(topicName)) {
        if (!force) {
            return;
        }
        logger.debug(`[Bus][createTaskON] topicName ${topicName}, the timer has been stopped`);
        clearTimeout(tasks.get(topicName));
    }
    tasks.set(topicName, setTimeout(() => {
        messageON(topicName, data);
        tasks.delete(topicName);
    }, callTime));
}

export function resetTaskON(topicName: string): void {
    if (tasks.get(topicName)) {
        clearTimeout(tasks.get(topicName));
        logger.debug(`[Bus][resetTaskON] topicName ${topicName}, the timer has been stopped`);
    }
}
