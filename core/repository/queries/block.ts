import { Block } from 'shared/model/block';

export default {
    getGenesisBlock: 'SELECT * FROM blocks WHERE "height" = 1',
    isBlockExists: 'SELECT EXISTS(SELECT * FROM blocks WHERE "id" = ${id})',
    deleteBlock: 'DELETE FROM blocks WHERE "id" = ${blockId};',
    loadLastBlock: 'SELECT * FROM blocks WHERE "height" = ( SELECT MAX("height") FROM blocks ) ORDER BY "height"',
    loadLastNBlocks: 'SELECT id FROM blocks ORDER BY height DESC LIMIT ${blockLimit}',
    deleteAfterBlock: 'DELETE FROM blocks WHERE "height" >= ( SELECT "height" FROM blocks WHERE "id" = ${id} );',
    loadFullBlockById: 'SELECT * FROM blocks WHERE id = ${id} ORDER BY "height"',
    getIdSequence(param: { height: number, delegates: number, limit: number}) {
        return `WITH 
            current_round AS (
                SELECT CEIL(b.height / ${param.delegates}::float)::bigint as height 
                FROM blocks b 
                WHERE b.height <= ${param.height} 
                ORDER BY b.height DESC LIMIT 1)
            rounds AS (
                SELECT * 
                FROM generate_series(
                    (SELECT * FROM current_round),
                    (SELECT * FROM current_round) - ${param.limit} + 1, 
                    -1
                )
            )
            SELECT
            b.id, b.height, CEIL(b.height / ${param.delegates}::float)::bigint AS round
            FROM blocks b
            WHERE b.height IN (
                SELECT ((n - 1) * ${param.delegates}) + 1 FROM rounds AS s(n)
            ) 
            ORDER BY height DESC`;
    },
    getCommonBlock(previousBlock: Block) {
        return [
            'SELECT COUNT("id")::int FROM blocks WHERE "id" = ${id}',
            (previousBlock ? 'AND "previous_block_id" = ${previousBlockId}' : ''),
            'AND "height" = ${height}'
        ].filter(Boolean).join(' ');
    },
    loadBlocksOffset(limit: number) {
        return [
            'SELECT * FROM blocks WHERE "height" >= ${offset}',
            (limit ? 'AND "height" < ${limit}' : ''),
            'ORDER BY "height"'
        ].filter(Boolean).join(' ');
    }
};
