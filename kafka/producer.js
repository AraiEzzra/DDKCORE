var kafka = require('kafka-node');
let Logger = require('../logger.js');
let logman = new Logger();
let logger = logman.logger;


var Producer = kafka.Producer,
    client = new kafka.Client(),
    producer = new Producer(client);

producer.on('ready', function () {
    logger.info('Producer is ready');
});

producer.on('error', function (err) {
    logger.error(err);
});

exports.isTopicExists = function (topic, cb) {
    client.loadMetadataForTopics([topic], function(err, resp) {
        if(err) {
            return setImmediate(cb, false);
        }
        return setImmediate(cb, true);
    });
};

exports.send = function(topic, message, partition, cb) {
    //producer.createTopics([topic]);
    let payloads = [
        { topic: topic, messages: JSON.stringify(message), partition: partition }
    ];
    producer.send(payloads, function (err, data) {
        if(err) {
            logger.error('error : ', err);
            return setImmediate(cb, err);
        } else {
            logger.info('data : ' + data);
            return setImmediate(cb, null, data);
        }
    });
};
