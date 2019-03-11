import { RPC_METHODS } from 'api/middleware/rpcHolder';

export const RPC = (rpcName: string) => {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        let fn = descriptor.value;
        return {
            configurable: true,

            get() {
                let boundFn = fn.bind(this);
                Reflect.defineProperty(this, propertyKey, {
                    value: boundFn,
                    configurable: true,
                    writable: true
                });

                RPC_METHODS[rpcName] = boundFn;

                return function () {
                    return boundFn.apply(this, arguments);
                };
            }
        };
    };
};
