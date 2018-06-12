let Register = require('prom-client').register;  
let Counter = require('prom-client').Counter; 
let Summary = require('prom-client').Summary;  
let ResponseTime = require('response-time');  
const Logger = require('./logger.js');
let logman = new Logger();
let logger = logman.logger;
let numOfRequests, pathsTaken, responses;

/**
 * @desc A Prometheus counter that counts the invocations of the different HTTP verbs
 * @desc e.g. a GET and a POST call will be counted as 2 different calls
 */
module.exports.numOfRequests = numOfRequests = new Counter({  
	name: 'numOfRequests',
	help: 'Number of requests made',
	labelNames: ['method']
});

/**
 * @desc A Prometheus counter that counts the invocations with different paths
 * @desc e.g. /foo and /bar will be counted as 2 different paths
 */
module.exports.pathsTaken = pathsTaken = new Counter({  
	name: 'pathsTaken',
	help: 'Paths taken in the app',
	labelNames: ['path']
});

/**
 * @desc A Prometheus summary to record the HTTP method, path, response code and response time
 */
module.exports.responses = responses = new Summary({  
	name: 'responses',
	help: 'Response time in millis',
	labelNames: ['method', 'path', 'status']
});

/**
 * @desc This funtion will start the collection of metrics and should be called from within in the app.js file
 */
module.exports.startCollection = function () {  
	logger.info('Starting the collection of metrics, the metrics are available on /metrics');
	require('prom-client').collectDefaultMetrics();
};

/**
 * @desc This function increments the counters that are executed on the request side of an invocation
 * @desc Currently it increments the counters for numOfPaths and pathsTaken
 */
module.exports.requestCounters = function (req, res, next) {  
	if (req.path != '/metrics') {
		numOfRequests.inc({ method: req.method });
		pathsTaken.inc({ path: req.path });
	}
	next();
};

/**
 * @desc This function increments the counters that are executed on the response side of an invocation
 * @desc Currently it updates the responses summary
 */
module.exports.responseCounters = ResponseTime(function (req, res, time) {  
	if(req.url != '/metrics') {
		responses.labels(req.method, req.url, res.statusCode).observe(time);
	}
});

/**
 * @desc In order to have Prometheus get the data from this app.
 * @desc a specific URL is registered.
 */
module.exports.injectMetricsRoute = function (App) {  
	App.get('/metrics', function(req, res) {
		res.set('Content-Type', Register.contentType);
		res.end(Register.metrics());
	});
};