// TODO add blockHeight
import { toSnakeCase } from 'shared/util/util';

const confirmationsSelector = `(SELECT max(height) from block) - ` +
    ` (select height from block where block.id = trs.block_id) as confirmations`;

export default {
    getTransaction: `SELECT *, ${confirmationsSelector} ` +
        ' FROM trs WHERE trs.id = ${id}',
    getTransactions: (filter, sort) =>
        `WITH max_height AS (SELECT max(height) as height FROM block)
            SELECT trs.*,
            (select max_height.height - b.height from max_height) as confirmations
            ${Object.keys(filter).length ? ', count(1) over () as count ' : ''}
            FROM trs INNER JOIN block b on trs.block_id = b.id
            ${Object.keys(filter).length ? `WHERE ${Object.keys(filter).map(
                key => `${toSnakeCase(key)} ${key === 'asset' ? '@>' : '='} \${${key}}`).join(' OR ')
            } ` : ''}
            ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getVotesWithStakeReward: 'SELECT *, count(1) over () as count FROM trs ' +
        ' where trs.sender_public_key = ${senderPublicKey} ' +
        ' and trs.type = ${voteType} and (asset ->> \'reward\')::bigint != 0' +
        ' ORDER BY trs.created_at DESC LIMIT ${limit} OFFSET ${offset}',
    getTransactionsCount: 'SELECT count(1) from trs',
};
