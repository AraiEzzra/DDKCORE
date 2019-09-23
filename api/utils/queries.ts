import { toSnakeCase } from 'shared/util/util';

export const transformFilter = (filter: { [key: string]: any }): string => {
    if (!Object.keys(filter).length) {
        return '';
    }

    return Object.keys(filter).map(key => `${toSnakeCase(key)} = \${${key}}`).join(' OR ');
};
