const request = require('request');
const {
  METHOD_RESULT_STATUS,
  prepareServerRequest,
  getDDKCoinConfig,
} = require('./util');


const nodeConfig = getDDKCoinConfig();
const nodeHost = nodeConfig.address;
const nodePort = nodeConfig.port;
const nodeProtocol = nodeConfig.ssl.enabled ? 'https' : 'http';
const nodeURL = `${nodeProtocol}://${nodeHost}:${nodePort}`;

console.log(nodeURL);

const options = {
    method: 'GET',
    uri: nodeURL + '/api/blocks?limit=10&offset=0&sort=height%3Adesc'
};
request(options, function (error, response, body) {
  console.log('request response:', JSON.parse(body));
});




















// let lisk = require('lisk-js');
// let app = new require('express').application;
// let Blocks = require('../../modules/blocks');

// console.log('app', app);
//
// let bs = new Blocks(function (a, b, c) {
//   console.log('getBlocks', a, b, c);
// }, app);


/*
lisk.api().searchDelegateByUsername('oliver', function (response) {
  console.log(response);
});
*/


// console.log('listPeers', lisk.api().listPeers());


// let router = require('express').Router();
//
// router['get']('getBlocks', function (a, b, c) {
//   console.log('getBlocks', a, b, c);
// });


//
// var request = require('request');
// var Block = {};


/*
const { methods, port, host, version } = require('./server.config');
const serverURL = 'http://' + host + ':' + port + '/api/blocks';

const options = {
    method: 'GET',
    uri: 'http://localhost:7001/api/blocks?limit=10&offset=0&sort=height%3Adesc'
};
request(options, function (error, response, body) {
  console.log('request response:', response);
});
*/
// let env = process.env;
// const { config } = require('/config/env');
// let env = require('./../../config/env');
// let config = require('./../../config');
//
// // console.log(env);
// console.log(config);






/*request({
  url: serverURL,
}, function(error, response, body) {
  // console.log('request:',  error);
  console.log('request response:',  response);
  // console.log('request:',  body);
});*/



/*request({
  url: 'https://www.npmjs.com/package/request',
}, (res, b) => {
  console.log('request:',  res, b);
});

Block.getBlocks = function(qs, callback) {
request({
      url: 'http://' + host + ':' + port + '/api/blocks',
      qs: qs
  },
  function(error, response, body) {
      if (error) {
          if (callback) {
              callback(error, false, null);
          }
      } else if (callback) {
          callback(null, body['success'], body);
      }
  });

};

Block.getBlock = function(blockId, callback) {
    request({
          method: 'GET',
          url: 'http://' + host + ':' + port + '/api/blocks',
          qs: {
              id: blockId
          },
          json: true
        },
        function(error, response, body) {
            if (error) {
                if (callback) {
                    callback(error, false, null);
                }
            } else if (callback) {
                callback(null, body['success'], body);
            }
        });
};
*/



/*
Block.getBlocks({
  limit: 10,
  offset: 0,
  sort: 'height:desc'
}, function (req) {
  console.log('getBlocks', req);
});
Block.getBlock({
  id: 10,
}, function (req) {
  console.log('getBlock', req);
});*/



