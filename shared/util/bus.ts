import { Subject } from 'rxjs/index';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any = null) {
    subjectOn.next({ data, topicName });
}

export function createTaskON(topicName: string, callTime: number, data: any = null) {
    // todo implement function to create schedule fro messageON
    setTimeout(() => messageON(topicName, data), callTime * 1000);
}
