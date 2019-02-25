import { Subject } from 'rxjs/index';
import { logger } from 'shared/util/logger';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any) {
    logger.debug(`[Bus][messageON] topicName ${topicName}, data: ${data}`);

    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null) {
    // todo implement function to create schedule fro messageON
    logger.debug(`[Bus][createTaskON] topicName ${topicName}, time: ${time}, data: ${data}`);

    setTimeout(() => messageON(topicName, data), callTime * 1000);
}
