// TODO add blockHeight
import { toSnakeCase } from 'shared/util/util';

export default {
    getTransaction: 'SELECT * FROM trs WHERE trs.id = ${id}',
    getTransactions: (filter, sort) =>
        `SELECT *, count(1) over () as count FROM trs 
          ${Object.keys(filter).length
            ? `WHERE ${Object.keys(filter).map(
                key => `${toSnakeCase(key)} ${key === 'asset' ? '@>' : '='} \${${key}}`).join(' OR ')
                } `
            : ''} 
          ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getVotesWithStakeReward: 'SELECT *, count(1) over () as count FROM trs where trs.sender_public_key = ${senderPublicKey} ' +
        'and trs.type = ${voteType} and (asset ->> \'reward\')::integer != 0 LIMIT ${limit} OFFSET ${offset}'
};
