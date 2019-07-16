export type Direction = 'ASC' | 'DESC';
export type Sort = [string, Direction];
export type Pagination = {
    limit: number,
    offset: number,
};

export const DEFAULT_LIMIT = 10;
export const DEFAULT_COUNT = 1000;
export const DEFAULT_FRACTION_DIGIST = 2;

export type SortFuncs<T> = { [field: string]: (a: T, b: T) => number };

export const combineSortFuncs = <T>(sortFuncs: SortFuncs<T>, sort: Array<Sort>): (a: T, b: T) => number => {
    const funcs: Array<(a: T, b: T) => number> = sort.map(([field, direction]) => {
        if (direction === 'ASC') {
            return sortFuncs[field];
        }
        return (a: T, b: T) => sortFuncs[field](a, b) * -1;
    });

    return (a: T, b: T): number => {
        for (const f of funcs) {
            const result = f(a, b);
            if (result === 0) {
                continue;
            }
            return result;
        }
        return 0;
    };
};

export const customSort = <T>(
    data: Array<T>,
    sortFuncs: SortFuncs<T>,
    params: Pagination & { sort: Array<Sort> },
): Array<T> => {
    const sortFunc = combineSortFuncs<T>(sortFuncs, params.sort);
    data.sort(sortFunc);

    return data.slice(params.offset, params.offset + params.limit);
};
