
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
// TODO change elastic use as module with config (add to app.js)
let connectionHost = process.env.ELASTICSEARCH_HOST || 'localhost:9200';

let Client = new elasticsearch.Client({
	hosts: connectionHost,
	log: 'error'
});

module.exports = Client;

/*************************************** END OF FILE *************************************/
