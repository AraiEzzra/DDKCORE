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

const elasticsearch = require('elasticsearch');
// TODO change elastic use as module with config (add to app.js)
const connectionHost = process.env.ELASTICSEARCH_HOST || 'localhost:9200';

const Client = new elasticsearch.Client({
    hosts: connectionHost,
    log: 'error'
});

module.exports = Client;

/** ************************************* END OF FILE ************************************ */
