export default {
    deleteByIds: 'DELETE FROM block WHERE id IN ($1:csv) RETURNING id',
    getById: 'SELECT * FROM block WHERE "id" = ${blockId}',
    getGenesisBlock: 'SELECT * FROM block WHERE "height" = 1',
    getLastBlock: 'SELECT * FROM block WHERE "height" = ( SELECT MAX("height") FROM block ) ORDER BY "height"',
    getLastNBlocks: 'SELECT id FROM block ORDER BY height DESC LIMIT ${blockLimit}',
    getMany(limit: number) {
        return [
            'SELECT * FROM block WHERE "height" > ${offset}',
            (limit ? 'AND "height" <= ${offset} + ${limit}' : ''),
            'ORDER BY "height" ' +
            (limit ? 'LIMIT ${limit}' : '')
        ].filter(Boolean).join(' ');
    },
    isExist: 'SELECT EXISTS(SELECT id FROM block WHERE "id" = ${blockId})'
};
