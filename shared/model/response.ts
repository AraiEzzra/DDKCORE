export interface ResponseEntityParams<T> {
    errors?: Array<string>;
    data?: T;
}

export class ResponseEntity<T> {
    success: boolean;
    errors?: Array<string>;
    data?: T;

    constructor(params: ResponseEntityParams<T> = {}) {
        this.success = params.errors ? !Boolean(params.errors.length) : true;
        this.errors = params.errors;
        this.data = params.data;
    }
}
