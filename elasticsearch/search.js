var esClient = require('./connection.js');

exports.searchQuery = function (index, queryMatch, cb) {
    esClient.search({
        index: index,
        type: index,
        body: {
            query: {
                match: queryMatch
            },
        }
    }, function (error, response, status) {
        if (error) {
            cb(error);
        }
        else {
            cb(null, response.hits.hits);
        }
    });
};