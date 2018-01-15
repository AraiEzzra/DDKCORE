var elasticsearch = require('elasticsearch');

var Client = new elasticsearch.Client({
	hosts: 'localhost:9200',
	log: 'trace'
	
	//configuration for production server
	/*hosts: [
		'https://[username]:[password]@[server]:[port]/',
		'https://[username]:[password]@[server]:[port]/'
	]*/
});

module.exports = Client;
