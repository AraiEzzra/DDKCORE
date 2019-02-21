import { Subject } from 'rxjs/index';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any = null) {
    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, time: number = Date.now(), data: any = null) {
    // todo implement function to create schedule fro messageON
    const callTime = (time - Date.now());
    setTimeout(() => messageON(topicName, data), callTime);
}
