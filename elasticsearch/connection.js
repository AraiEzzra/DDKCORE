

// elastic search server connection
let elasticsearch = require('elasticsearch');
let config = require('../config.json');
let connectionHost = config.elasticsearchHost + ':9200' || 'localhost:9200';

let Client = new elasticsearch.Client({
	hosts: connectionHost, // We can put an array here as well to provide more than one hosts. See below example
	log: 'error'
	
	//configuration for production server
	/*hosts: [
		'https://[username]:[password]@[server]:[port]/',
		'https://[username]:[password]@[server]:[port]/'
	]*/
});

module.exports = Client;
