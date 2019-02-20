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
