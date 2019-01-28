import { Application } from 'express';

const MethodEnum = {
    GET: 'get',
    POST: 'post',
    PUT: 'put'
};

let targets = new Set();

export const setRoute = (app: Application) => {
    if (app) {
        targets.forEach(item => {
            item.ctrl.forEach(route => {
                app[route.method](item.path + route.path, route.func);
            });
        });
    }
};

export const Controller = (path: string) => {
    return (controller: Function) => {
        if (controller.prototype.routes) {
            targets.add({
                path,
                ctrl: controller.prototype.routes
            });
        }
    };
};

export const GET = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath(MethodEnum.GET, path, target, descriptor);
    };
};

export const POST = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath(MethodEnum.POST, path, target, descriptor);
    };
};

export const PUT = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath(MethodEnum.PUT, path, target, descriptor);
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
        method,
        path,
        'func': descriptor.value
    });
};

// TODO Need to Remove
// @Controller('/test1')
// class Class {
//     constructor() {}
//
//     @GET('/')
//     test1(req, res) {
//         res.json({
//             message: 'Class 1. Path "/" \n'
//         });
//     }
// }
//
// @Controller('/test2')
// class Class2 {
//     constructor() {}
//
//     @GET('/')
//     test(req, res) {
//         res.json({
//             message: 'Class 2. Path "/test"'
//         });
//     }
// }
