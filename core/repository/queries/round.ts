
export default {
    getByHeight: 'SELECT * FROM round WHERE height_start <= ${height} ORDER BY height_start DESC LIMIT 1',
    getMany: 'SELECT * FROM round ORDER BY height_start LIMIT ${limit} OFFSET ${offset}',
    deleteByStartHeight: 'DELETE FROM round WHERE height_start = ${height}',
    getCount: 'SELECT COUNT(*) FROM round',
};
