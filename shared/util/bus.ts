import { Subject } from 'rxjs/index';
import { logger } from 'shared/util/logger';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any) {
    logger.debug(`[Bus][messageON] topicName ${topicName}, data: ${data}`);

    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, time: number = new Date().getTime(), data: any = null) {
    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${time}, data: ${data}`);

    const callTime = (time - Date.now());
    setTimeout(() => messageON(topicName, data), callTime);
}
