import elasticsearch from 'elasticsearch';

class ElasticsearchConnection {
    private connectionHost: string = process.env.ELASTICSEARCH_HOST || 'localhost:9200';
    public Client: any;

    constructor() {
        if (!this.Client) {
            this.init();
        }
    }

    init(): void {
        this.Client = new elasticsearch.Client({
            hosts: this.connectionHost,
            log: 'error'
        });
    }
}

export const Client = new ElasticsearchConnection().Client;
