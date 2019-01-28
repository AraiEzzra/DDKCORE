import { Application, Request, Response as Resp, NextFunction } from 'express';
import Response from 'shared/model/response';
import { validate } from './validate';

let targets = new Set();

interface IPropertyRoute {
    method: string;
    path: string;
    func: Function;
    validate?: Object;
    propertyKey?: string;
}

const MethodEnum = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    USE: 'use'
};

export const setRoute = (app: Application) => {
    if (app) {
        targets.forEach(item => {
            item.ctrl.forEach((route: IPropertyRoute) => {
                if (route.validate) {
                    /**
                     * Add middleware for validate request
                     */
                    app[MethodEnum.USE](item.path + route.path, (req: Request, res: Resp, next: NextFunction) => {
                        if (!validate(route.validate, route.propertyKey)) {
                            return new Response({
                                errors: ['Bad request.']
                            });
                        }
                        next();
                    });
                }
                /**
                 * Add route
                 */
                app[route.method](item.path + route.path, route.func);
            });
        });
    }
};

/**
 *
 * @param path
 * @constructor
 */
export const Controller = (path: string) => {
    return (controller: Function) => {
        if (controller.prototype.routes) {
            const body = {
                path,                              // path controller
                ctrl: controller.prototype.routes, // path to controller methods
            };
            targets.add(body);
        }
    };
};
/**
 *
 * @param path
 * @constructor
 */
export const GET = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath(MethodEnum.GET, path, target, descriptor, propertyKey);
    };
};

/**
 *
 * @param path
 * @constructor
 */
export const POST = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath(MethodEnum.POST, path, target, descriptor, propertyKey);
    };
};

/**
 *
 * @param path
 * @constructor
 */
export const PUT = (path: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        addEndpointPath(MethodEnum.PUT, path, target, descriptor, propertyKey);
    };
};

/**
 * Decorator for Validate request, that need to be after decorator GET, PUT or POST
 * @param data
 * @constructor
 */
const Validate = (data) => {
    return ( target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      if (data) {
          Object.defineProperty(target, 'validate', {
              value: data,
              configurable: false,
              writable: false,
              enumerable: false
          });
      }
    };
};

/**
 * Add route to list
 * @param method
 * @param path
 * @param target
 * @param descriptor
 */
const addEndpointPath = (method: string,
                         path: string,
                         target: any,
                         descriptor: PropertyDescriptor,
                         propertyKey: string) => {
    if (!target.hasOwnProperty('routes')) {
        Object.defineProperty(target, 'routes', {
            value: [],
            configurable: false,
            writable: false,
            enumerable: false
        });
    }
    const propertyRoute: IPropertyRoute = {
        method,
        path,
        func: descriptor.value,
        validate: target.validate,
        propertyKey
    };
    target.routes.push(propertyRoute);
};


// TODO Need to Remove
// @Controller('/test1')
// class Class {
//     constructor() {}
//
//     @GET('/')
//     @Validate({})
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
//     @Validate({ body: 'test validate' })
//     test(req, res) {
//         res.json({
//             message: 'Class 2. Path "/test"'
//         });
//     }
// }


