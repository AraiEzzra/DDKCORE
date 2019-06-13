export function ON(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsON = target.eventsON || new Map();
        target.eventsON.set(topicName, descriptor.value);
    };
}

export function MAIN(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsMAIN = target.eventsMAIN || new Map();
        target.eventsMAIN.set(topicName, descriptor.value);
    };
}

export function RPC(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsRPC = target.eventsRPC || new Map();
        target.eventsRPC.set(topicName, descriptor.value);
    };
}
