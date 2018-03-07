// Generalised method to create, delete or check existence of an index
var client = require('./connection.js');

/**
* check if the index exists
*/
function isIndexExists(indexName, cb) {  
    var result = client.indices.exists({
        index: indexName
    });
    return result;
}
exports.isIndexExists = isIndexExists; 

/**
* create an index
*/
function createIndex(indexName, cb) { 
    client.indices.create({
        index: indexName
    }, function (err, resp, status) {
        if (err) {
            cb(err);
        }else {
            cb(null);
        }
    });
};
exports.createIndex = createIndex;

/**
* Delete an existing index
*/
function deleteIndex(indexName, cb) {  
    client.indices.delete({
        index: indexName
    }, function (err, resp, status) {
        if (err) {
            cb(err);
        }
        else {
            cb(null);
        }
    });
}
exports.deleteIndex = deleteIndex;

/**
* Search in elastic search
*/
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

exports.searchQuery = searchQuery;