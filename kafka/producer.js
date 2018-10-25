const Kafka = require('node-rdkafka');
let Logger = require('../logger.js');
let logman = new Logger();
let logger = logman.logger;


/* var Producer = kafka.Producer,
    client = new kafka.Client(),
    producer = new Producer(client); */


var producer = new Kafka.Producer({
    'metadata.broker.list': 'localhost:9092',
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

producer.on('delivery-report', function (err, report) {
    if (err) {
        logger.error('delivery-report Error : ' + err);
    } else {
        logger.info('delivery-report: ' + JSON.stringify(report));
    }
});

producer.on('ready', function () {
    logger.info('Producer is ready');
    //producer.Topic(['queuedTransactions', 'bundeledTransactions', 'multisignatureTransaction']);
});

producer.on('disconnected', function (arg) {
    logger.info('producer disconnected ' + JSON.stringify(arg));
});

producer.connect();

exports.isTopicExists = function (topic, cb) {
    producer.getMetadata(topic, function(err) {
        if(err) {
            return setImmediate(cb, false);
        }
        return setImmediate(cb, true);
    });
};

exports.send = function(topic, message, partition, cb) {
    producer.produce(topic, partition, Buffer.from(JSON.stringify(message)), function(err) {
        if(err) {
            return setImmediate(cb, err);
        } 
        return setImmediate(cb, null);
    });
};
