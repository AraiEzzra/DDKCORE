//Hotam Singh: elastic search server connection
var elasticsearch = require('elasticsearch');

var Client = new elasticsearch.Client({
	hosts: '180.151.230.12:9200',
	log: 'error'
	
	//configuration for production server
	/*hosts: [
		'https://[username]:[password]@[server]:[port]/',
		'https://[username]:[password]@[server]:[port]/'
	]*/
});

module.exports = Client;
