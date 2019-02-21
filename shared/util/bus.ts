import { Subject } from 'rxjs/index';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any = null) {
    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, time: number = new Date().getTime(), data: any = null) {
    const callTime = (time - Date.now());
    setTimeout(() => messageON(topicName, data), callTime);
}
