import { Subject } from 'rxjs/index';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any = null) {
    subjectOn.next({ data, topicName });
}
