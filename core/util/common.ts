export interface IFunctionResponse {
    success: boolean;
    errors: Array<string>;
}

export interface ITableObject {
    table: string;
    fields: Array<string>;
    values: any;
}
