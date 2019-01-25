import { app } from '../app';

export const Controller = (path) => {
    return (controller: Function) => {
        if (controller.prototype.routes) {
            controller.prototype.routes.forEach(route => {
                app[route.method](path + route.path, route.func);
            });
        }
    };
};

export const GET = (path) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath('get', path, target, descriptor);
    };
};

export const POST = (path) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath('post', path, target, descriptor);
    };
};

export const PUT = (path) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath('put', path, target, descriptor);
    };
};

const addEndpointPath = (method: string, path: string,  target: any, descriptor: PropertyDescriptor) => {
    if (!target.hasOwnProperty('routes')) {
        Object.defineProperty(target, 'routes', {
            value: [],
            configurable: false,
            writable: false,
            enumerable: false
        });
    }
    target.routes.push({
        'method': method,
        'path': path,
        'func': descriptor.value
    });
};

// REMOVE

// @Controller('/test')
// class Class {
//     constructor() {
//     }
//
//     @GET('test')
//     test() {
//     }
// }
//
// @Controller('/test2')
// class Class2 {
//     constructor() {
//     }
//
//     @GET('test')
//     test() {
//     }
// }
//
// const c = new Class();
// const c2 = new Class2();

