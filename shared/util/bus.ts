import { Subject } from 'rxjs';

import { logger } from 'shared/util/logger';

export const subjectOn = new Subject();

export enum MainTasks {
    BLOCK_GENERATE = 'BLOCK_GENERATE',
    BLOCK_RECEIVE = 'BLOCK_RECEIVE',
    EMIT_SYNC_BLOCKS = 'EMIT_SYNC_BLOCKS',
}

const tasks: Map<string, NodeJS.Timeout> = new Map();

export function messageON(topicName: string, data: any = {}): void {
    logger.trace(`[Bus][messageON] topicName ${topicName}`);

    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null, force: boolean = true): void {
    // todo implement function to create schedule fro messageON
    if (tasks.get(topicName)) {
        if (!force) {
            return;
        }
        logger.debug(`[Bus][createTaskON] topicName ${topicName}, the timer has been stopped`);
        clearTimeout(tasks.get(topicName));
    }

    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${callTime}`);
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
