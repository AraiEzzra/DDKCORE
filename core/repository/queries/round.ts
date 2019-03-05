
export default {
    getByHeight: 'SELECT * FROM round WHERE height_start <= ${height} AND height_finish >= ${height}',
    getMany(limit: number) {
        return [
            'SELECT * FROM round WHERE height_start <= ${offset}',
            (limit ? 'AND height_start < ${limit}' : ''),
            'ORDER BY height_start'
        ].filter(Boolean).join(' ');
    },
    deleteByStartHeight: 'DELETE FROM round WHERE height_start = ${height}',
};
