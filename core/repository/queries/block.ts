export default {
    deleteByIds: 'DELETE FROM block WHERE id IN ($1:csv)',
    deleteAfterBlock: 'DELETE FROM blocks WHERE "height" >= ( SELECT "height" FROM blocks WHERE "id" = ${id} );',
    getById: 'SELECT * FROM blocks WHERE "id" = ${id}',
    getGenesisBlock: 'SELECT * FROM blocks WHERE "height" = 1',
    getLastBlock: 'SELECT * FROM blocks WHERE "height" = ( SELECT MAX("height") FROM blocks ) ORDER BY "height"',
    getLastNBlocks: 'SELECT id FROM blocks ORDER BY height DESC LIMIT ${blockLimit}',
    getMany(limit: number) {
        return [
            'SELECT * FROM blocks WHERE "height" >= ${offset}',
            (limit ? 'AND "height" < ${limit}' : ''),
            'ORDER BY "height"'
        ].filter(Boolean).join(' ');
    },
    isExist: 'SELECT EXISTS(SELECT * FROM blocks WHERE "id" = ${id})'
};
