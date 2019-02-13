import { Application, Request, Response as Resp, NextFunction } from 'express';
import { validate as validator } from './validate';
import * as HttpStatus from 'http-status-codes';

let targets = new Set();

interface IPropertyRoute {
    method: string;
    path: string;
    func: Function;
    validate?: Object;
    propertyKey?: string;
}

const MethodEnum = {
    GET:  'get',
    POST: 'post',
    PUT:  'put',
    USE:  'use'
};

export const setRoute = (app: Application) => {
    if (app) {
        targets.forEach(item => {
            item.ctrl.forEach((route: IPropertyRoute) => {
                if (!!route.validate) {
                    /**
                     * Add middleware for validate request
                     */
                    app[MethodEnum.USE](item.path + route.path, async (req: Request, res: Resp, next: NextFunction) => {
                        const isValid = await validator(route.validate, req.body, route.propertyKey);
                        if (!isValid) {
                            /**
                             *  TODO need to replace on Custom Response
                             */
                            res.status(HttpStatus.BAD_REQUEST);
                            res.json({
                                errors: ['Bad request.']
                            });

                            return;
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
export const validate = (schemaValid: Object) => {
    return ( target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      if (!!schemaValid) {
          Object.defineProperty(target, 'validate', {
              value: schemaValid,
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

export function ON(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsON = target.eventsON || [];
        target.eventsON.push({ handlerTopicName: topicName, handlerFunc: descriptor.value });
    };
}

export function RPC(topicName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.eventsRPC = target.eventsRPC || [];
        target.eventsRPC.push({ handlerTopicName: topicName, handlerFunc: descriptor.value });
    };
}
