import { Application } from 'express'
let app: Application = undefined;
let targets = new Set();

export const setApp = (a: Application) => {
    if (!app) {
        app = a;
        targets.forEach(item => {
            item.ctrl.forEach(route => {
                app[route.method](item.path + route.path, route.func);
            });
        })
    }
};

export const Controller = (path) => {
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
        addEndpointPath('get', path, target, descriptor);
    };
};

export const POST = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath('post', path, target, descriptor);
    };
};

export const PUT = (path: string) => {
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

// Need to Remove
@Controller('/test')
class Class {
    constructor() {}

    @GET('/')
    test1() {
        console.log('Class 1. Path "/"')
    }

    @GET('/test')
    test2() {
        console.log('Class 1. Path "/test"')
    }
}

@Controller('/test2')
class Class2 {
    constructor() {}

    @GET('/test')
    test() {
        console.log('Class 2. Path "/test"')
    }
}