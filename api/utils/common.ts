export type Sort = [string, 'ASC' | 'DESC'];
export type Pagination = {
    limit: number,
    offset: number
}

export const DEFAULT_LIMIT = 10;
