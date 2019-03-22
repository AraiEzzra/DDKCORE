// TODO add blockHeight
import { toSnakeCase } from 'shared/util/util';

export default {
    getTransaction: 'SELECT * FROM trs WHERE trs.id = ${id}',
    getTransactions: (filter, sort) =>
        `SELECT *, count(1) over () as count FROM trs 
          ${Object.keys(filter).length ? `WHERE ${Object.keys(filter).map(key => `${toSnakeCase(key)} = \${${key}}`)} ` : ''} 
          ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
};
