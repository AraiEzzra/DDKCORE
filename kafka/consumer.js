
const Kafka = require('node-rdkafka');
let config = process.env.NODE_ENV === 'development' ? require('../config/default') : process.env.NODE_ENV === 'testnet' ? require('../config/testnet') : require('../config/mainnet');

var consumer = new Kafka.KafkaConsumer({
    'group.id': 'kafka',
    'metadata.broker.list': config.kafka.host + ':' + config.kafka.port
  }, {});

module.exports = consumer;
