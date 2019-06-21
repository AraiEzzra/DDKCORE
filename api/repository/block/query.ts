import { toSnakeCase } from 'shared/util/util';

export default {
    getBlock: 'SELECT * FROM block WHERE block.id = ${id}',
    getBlocks: (filter, sort) =>
        `SELECT *, count(1) over () as count FROM block ${Object.keys(filter).length 
            ? `WHERE ${Object.keys(filter).map(key => `${toSnakeCase(key)} = \${${key}}`)} `
            : ''} 
          ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getBlockByHeight: 'SELECT * FROM block WHERE block.height = ${height}',
    getLastBlock: 'SELECT * FROM block ORDER BY height DESC LIMIT 1',
};
