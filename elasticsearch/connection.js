
/**
* 
* @desc connects to elasticsearch server 
* @param {module} client - elasticsearch module
* configuration for production server
* @param {array} hosts: [
	- 'https://[username]:[password]@[server]:[port]/',
	- 'https://[username]:[password]@[server]:[port]/'
	]
*/

let elasticsearch = require('elasticsearch');
let config = process.env.NODE_ENV === 'development' ? require('../config/default') : process.env.NODE_ENV === 'testnet' ? require('../config/testnet') : require('../config/mainnet');
let connectionHost = config.elasticsearchHost || 'localhost:9200';

let Client = new elasticsearch.Client({
	hosts: connectionHost,
	log: 'error'
});

module.exports = Client;

/*************************************** END OF FILE *************************************/
