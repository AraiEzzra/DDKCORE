/* var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = new kafka.Client(),
    consumer = new Consumer(client,
        [{ topic: 'transactions', offset: 0 }],
        {
            autoCommit: false
        }
    );

module.exports = consumer;

consumer.on('message', function (message) {
    logger.info(message);
});

consumer.on('error', function (err) {
    logger.error('Kafka Consumer Error:', err);
});

consumer.on('offsetOutOfRange', function (err) {
    logger.error('Kafka Consumer offsetOutOfRange:', err);
});
 */


const Kafka = require('node-rdkafka');
let Logger = require('../logger.js');
let logman = new Logger();
let logger = logman.logger;

var consumer = new Kafka.KafkaConsumer({
    'group.id': 'kafka',
    'metadata.broker.list': 'localhost:9092'
  }, {});

module.exports = consumer;
