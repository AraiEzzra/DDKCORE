import { toSnakeCase } from 'shared/util/util';

export default {
    getBlock: 'SELECT * FROM block WHERE block.id = ${id}',
    getBlocks: (filter, sort) =>
        `SELECT *, count(1) over () as count FROM block ${Object.keys(filter).length 
            ? `WHERE ${Object.keys(filter).map(key => `${toSnakeCase(key)} = \${${key}}`)} `
            : ''} 
          ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
};
