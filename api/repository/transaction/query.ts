// TODO add blockHeight
import { toSnakeCase } from 'shared/util/util';

export default {
    getTransaction: 'SELECT *,' +
        ' (SELECT max(height) from block) - (select height from block where block.id = trs.block_id) as confirmations' +
        ' FROM trs WHERE trs.id = ${id}',
    getTransactions: (filter, sort) =>
        `SELECT *, 0 as confirmations, count(1) over () as count FROM trs
          ${Object.keys(filter).length
            ? `WHERE ${Object.keys(filter).map(
                key => `${toSnakeCase(key)} ${key === 'asset' ? '@>' : '='} \${${key}}`).join(' OR ')
            } `
            : ''}
          ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getVotesWithStakeReward: 'SELECT *, count(1) over () as count FROM trs' +
        ' where trs.sender_public_key = ${senderPublicKey} ' +
        ' and trs.type = ${voteType} and (asset ->> \'reward\')::bigint != 0 LIMIT ${limit} OFFSET ${offset}'
};
