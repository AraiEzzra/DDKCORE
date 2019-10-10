import { timeService } from 'shared/util/timeServiceClient';

export function messageON(topicName: string, data: any = null) {
    console.log('subscribe for :: ', { data, topicName });
}

export function createTaskON(topicName: string, time: number = timeService.getTime(), data: any = null) {
    console.log('create job for bus :: ');
}
