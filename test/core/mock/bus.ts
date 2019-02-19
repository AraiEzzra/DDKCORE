export function messageON(topicName: string, data: any = null) {
    console.log('subscribe for :: ', { data, topicName });
}

export function createTaskON(topicName: string, time: number = new Date().getTime(), data: any = null) {
    console.log('create job for bus :: ');
}
