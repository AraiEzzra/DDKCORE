import { RPC_METHODS } from 'api/middleware/rpcHolder';

export const RPC = function (rpcName: string) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        RPC_METHODS[rpcName] = descriptor.value;
        return descriptor.value;
    };
};
