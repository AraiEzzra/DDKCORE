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
            ${Object.keys(filter).length ? ', count(1) over () as count ' : ''}
            FROM trs INNER JOIN block b on trs.block_id = b.id
            ${isFiltered(filter) ? `WHERE ${Object.keys(filter)
            .map(key => `${toSnakeCase(key)} ${key === 'asset' ? '@>' : '='} \${${key}}`).join(' AND ')
            }` : ''}
            ORDER BY ${sort} LIMIT \${limit} OFFSET \${offset}`,
    getTransactionsByAsset: (filter: { [key: string]: any }, sort: string) =>
        `WITH max_height AS (SELECT max(height) as height FROM block)
        SELECT t.*, (select max_height.height - b.height from max_height) as confirmations
            ${Object.keys(filter).length ? ', count(1) over () as count ' : ''}
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
    getUserTransactions:
        `WITH last_block AS (SELECT max(height) as height FROM block) ` +
        ` SELECT t.*, count(1) over () as count ` +
        ` , (select last_block.height - t.height from last_block) as confirmations` +
        ` FROM ( ` +
        ` SELECT trs.*, height FROM address_to_trs ` +
        ` LEFT JOIN trs ON trs.id = address_to_trs.trs_id ` +
        ` LEFT JOIN block ON block.id = trs.block_id ` +
        ` WHERE address_to_trs.recipient_address = \${recipientAddress} ` +
        ` UNION ALL ` +
        ` SELECT trs.*, height FROM trs ` +
        ` LEFT JOIN block ON block.id = trs.block_id ` +
        ` WHERE sender_public_key = \${senderPublicKey} ` +
        ` ) t ORDER BY t.created_at desc LIMIT \${limit} OFFSET \${offset};`,
};
