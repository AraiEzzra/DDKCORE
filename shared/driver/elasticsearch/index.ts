import { Client } from 'elasticsearch';

const connectionHost = process.env.ELASTICSEARCH_HOST || 'localhost:9200';
const connectionOptions = {
    hosts: [connectionHost],
    log: 'error',
};

export class ElasticsearchConnector {
    static instance: ElasticsearchConnector = undefined;
    connector: any;

    constructor() {
        if (ElasticsearchConnector.instance === undefined) {
            this.connector = new Client(connectionOptions);
            ElasticsearchConnector.instance = this;
        }
        return ElasticsearchConnector.instance;
    }
}

export default new ElasticsearchConnector().connector;
