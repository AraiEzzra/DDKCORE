//hotam: added new service to check status of elasticsearch server

angular.module('ETPApp').service('esClient', function (esFactory) {
    return esFactory({
        host: '180.151.230.12:9200',
        log: 'error'
    });
});

