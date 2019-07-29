// TODO add blockHeight
import { toSnakeCase } from 'shared/util/util';
import { isFiltered } from 'shared/util/filter';

const confirmationsSelector = `(SELECT max(height) from block) - ` +
    ` (select height from block where block.id = trs.block_id) as confirmations`;

export default {
    getTransaction: `SELECT *, ${confirmationsSelector} ` +
        ' FROM trs WHERE trs.id = ${id}',
    getTransactions: (filter: { [key: string]: any }, sort: string) =>
        `WITH max_height AS (SELECT max(height) as height FROM block)
            SELECT trs.*,
            (select max_height.height - b.height from max_height) as confirmations
            ${Object.keys(filter).length && !isFiltered(filter, new Set(['type']))
                ? ', count(1) over () as count '
                : ''}
            FROM trs INNER JOIN block b on trs.block_id = b.id
            ${isFiltered(filter) ? `WHERE ${Object.keys(filter).map(
                key => `${toSnakeCase(key)} ${key === 'asset' ? '@>' : '='} \${${key}}`).join(' OR ')
            } ` : ''}
            ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getTransactionsByAsset: (filter: { [key: string]: any }, sort: string) =>
        `WITH max_height AS (SELECT max(height) as height FROM block)
        SELECT t.*, (select max_height.height - b.height from max_height) as confirmations
            ${Object.keys(filter).length && !isFiltered(filter, new Set(['type']))
                ? ', count(1) over () as count '
                : ''}
        FROM (
            SELECT trs.* FROM trs
            ${Object.keys(filter).filter(key => key === 'asset').length ?
            `WHERE ${Object.keys(filter).filter(key => key === 'asset').map(
                key => `${toSnakeCase(key)} @> \${${key}}`
            ).join(' OR ')} ` : ''}
            ${Object.keys(filter).filter(key => key !== 'asset').length ?
            `UNION SELECT trs.* FROM trs WHERE ${Object.keys(filter).filter(key => key !== 'asset').map(
                key => `${toSnakeCase(key)} = \${${key}}`).join(' OR ')
            } ` : ''}
        ) t
        INNER JOIN block b on t.block_id = b.id
        ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getVotesWithStakeReward: 'SELECT *, count(1) over () as count FROM trs ' +
        ' where trs.sender_public_key = ${senderPublicKey} ' +
        ' and trs.type = ${voteType} and (asset ->> \'reward\')::bigint != 0' +
        ' ORDER BY trs.created_at DESC LIMIT ${limit} OFFSET ${offset}',
    getTransactionsCount: 'SELECT count(1) from trs',
};
