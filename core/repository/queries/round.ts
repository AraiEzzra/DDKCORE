
export default {
    getByHeight: 'SELECT * FROM round WHERE height_start <= ${height} AND height_finish >= ${height}',
    getMany: 'SELECT * FROM round ORDER BY height_start LIMIT ${limit} OFFSET ${offset}',
    deleteByStartHeight: 'DELETE FROM round WHERE height_start = ${height}',
};
