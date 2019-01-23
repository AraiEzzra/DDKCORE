export interface IApiResponce<T> {
    success: boolean;
    error?: boolean;
    response?: T;
}
