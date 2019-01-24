export default interface CrudRepository<T> {

    create(data: any): T;

    get(data: any): T;

    delete(data: any): T;

    update(data: any): T;

    getAll(data?: any);
}
