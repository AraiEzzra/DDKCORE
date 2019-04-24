export type Direction = 'ASC' | 'DESC';
export type Sort = [string, Direction];
export type Pagination = {
    limit: number,
    offset: number
};

export const DEFAULT_LIMIT = 10;
