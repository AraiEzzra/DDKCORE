import { Subject } from 'rxjs';
import { logger } from 'shared/util/logger';
import { SECOND } from 'core/util/const';

export const subjectOn = new Subject();
export const subjectRpc = new Subject();

export function messageON(topicName: string, data: any) {
    logger.debug(`[Bus][messageON] topicName ${topicName}, data: ${data}`);

    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null) {
    // todo implement function to create schedule fro messageON
    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${callTime}, data: ${data}`);

    setTimeout(() => messageON(topicName, data), callTime * SECOND);
}
