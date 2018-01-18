var client = require('./connection.js');

/**
* check if the index exists
*/
function indexExists(cb) {  
    var result = client.indices.exists({
        index: 'etp'
    });
    return result;
}
exports.indexExists = indexExists; 

/**
* create an index
*/
function createIndex(cb) { 
    client.indices.create({
        index: 'etp'
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
function deleteIndex(cb) {  
    client.indices.delete({
        index: 'etp'
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