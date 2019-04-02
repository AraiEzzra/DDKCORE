export function ON(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsON = target.eventsON || [];
        target.eventsON.push({ handlerTopicName: topicName, handlerFunc: descriptor.value });
    };
}

export function MAIN(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsMAIN = target.eventsMAIN || {};
        target.eventsMAIN[topicName] = descriptor.value;
    };
}

export function RPC(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsRPC = target.eventsRPC || [];
        target.eventsRPC.push({ handlerTopicName: topicName, handlerFunc: descriptor.value });
    };
}
