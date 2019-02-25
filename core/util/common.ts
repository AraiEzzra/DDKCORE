export interface IFunctionResponse {
    success: boolean;
    errors?: Array<string>;
}

export interface ITableObject {
    table: string;
    fields: Array<string>;
    values: any;
}

export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export const compose = (...fns): any => {
  return fns.reduceRight((prevFn, nextFn) =>
    (...args) => nextFn(prevFn(...args)),
    value => value
  );
};

// TODO: check it
export const asyncCompose = (...fns) => input =>
  fns.reduceRight((chain, func) => chain.then(func), Promise.resolve(input));
