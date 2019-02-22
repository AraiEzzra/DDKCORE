import { Subject } from 'rxjs/index';

const subjectOn = new Subject();
const subjectRpc = new Subject();

export { subjectOn, subjectRpc };

export function messageON(topicName: string, data: any = null) {
    subjectOn.next({ data, topicName });
}

let timer = {};
export function createTaskON(topicName: string, callTime: number, data: any = null) {
    // todo implement function to create schedule fro messageON
    // if (timer.topicName) {
    //     clearTimeout(timer.topicName);
    // }

    timer.topicName = setTimeout(() => messageON(topicName, data), callTime * 1000);
}
