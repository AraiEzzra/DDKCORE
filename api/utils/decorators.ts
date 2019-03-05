import { RPC_METHODS } from 'api/middleware/rpcHolder';

export const RPC = function (rpcName: string) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {

        console.log('TARGET: ', target);
        console.log('propertyKey: ', propertyKey);
        console.log('descriptor: ', descriptor);

        RPC_METHODS[rpcName] = descriptor.value;
        return descriptor.value;
    };
};
