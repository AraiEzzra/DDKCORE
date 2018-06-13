/**
  * @desc permorms cluster operations
  * @param {module} client - elasticsearch module
*/

let client = require('./connection.js');

/**
* 
* @desc check if an index already exists in the cluster
* @param {String} indexName - index name
* @return bool - true or false
* 
*/

function isIndexExists(indexName) {  
	let result = client.indices.exists({
		index: indexName
	});
	return result;
}
exports.isIndexExists = isIndexExists; 

/**
* 
* @desc create an index
* @param {String} indexName - index name
* @param {function} cb - Callback function.
* @return {String} - err or null
* 
*/

function createIndex(indexName, cb) { 
	client.indices.create({
		index: indexName
	}, function (err) {
		if (err) {
			cb(err);
		}else {
			cb(null);
		}
	});
}
exports.createIndex = createIndex;

/**
* 
* @desc Delete an existing index
* @param {String} indexName - index name
* @param {function} cb - Callback function.
* @return {String} - err or null
* 
*/
function deleteIndex(indexName, cb) {  
	client.indices.delete({
		index: indexName
	}, function (err) {
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
* 
* @desc Search in elastic search
* @param {String} index - index name
* @param {Object} queryMatch - search query
* @param {function} cb - Callback function.
* @return {String} - err or null
* 
*/
function searchQuery(index, queryMatch, cb) {
	client.search({
		index: index,
		type: index,
		body: {
			query: {
				match: queryMatch
			},
		}
	}, function (error, response) {
		if (error) {
			cb(error);
		}
		else {
			cb(null, response.hits.hits);
		}
	});
}

exports.searchQuery = searchQuery;

/*************************************** END OF FILE *************************************/
