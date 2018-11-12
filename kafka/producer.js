const Kafka = require('node-rdkafka');
let Logger = require('../logger.js');
let logman = new Logger();
let logger = logman.logger;
let config = process.env.NODE_ENV === 'development' ? require('../config/default') : process.env.NODE_ENV === 'testnet' ? require('../config/testnet') : require('../config/mainnet');

var producer = new Kafka.Producer({
    'metadata.broker.list': config.kafka.host + ':' + config.kafka.port,
    'socket.keepalive.enable': true,
    'dr_cb': true
});

//logging debug messages, if debug is enabled
producer.on('event.log', function (log) {
    logger.info('Log: ' + log);
});

//logging all errors
producer.on('event.error', function (err) {
    logger.error('Error from producer : ' + err);
});

//logging delivery-report
producer.on('delivery-report', function (err, report) {
    if (err) {
        logger.error('delivery-report Error : ' + err);
    } else {
        logger.info('delivery-report: ' + JSON.stringify(report));
    }
});

//producer is ready
producer.on('ready', function () {
    logger.info('Producer is ready');
});

//event when producer is disconnected
producer.on('disconnected', function (arg) {
    logger.info('producer disconnected ' + JSON.stringify(arg));
});

//connect to Kafka
producer.connect();

//Check for topic existance
exports.isTopicExists = function (topic, cb) {
    producer.getMetadata(topic, function(err) {
        if(err) {
            return setImmediate(cb, false);
        }
        return setImmediate(cb, true);
    });
};

//Send data to Kafka server
exports.send = function(topic, message, partition, cb) {
    logger.info('Adding transaction ' + message.id + ' into ' + topic + ' topic');
    try {
        producer.produce(topic, partition, Buffer.from(JSON.stringify(message)), function(err) {
            if(err) {
                logger.error('Error while send topic : ' + err.message);
                return setImmediate(cb, err);
            } 
            logger.info('transaction sent to ' + topic + ' topic successfully');
            return setImmediate(cb, null);
        });
    } catch (e) {
        logger.error('Error while send topic : ' + e.message);
    }
    
};
