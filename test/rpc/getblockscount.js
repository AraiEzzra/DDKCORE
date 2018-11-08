const chai = require('chai');
const expect = require('chai').expect;
const Logger = require('./../../logger.js');
const logger = (new Logger()).logger;
const db = require('./../../helpers/database.js');

const WebSocket = require('rpc-websockets').Client;
const modulesLoader = require('../common/initModule').modulesLoader;
const node = require('../node.js');

describe('RPC method getblocks', function () {

  describe('connect to api', function () {

    it('/api/blocks', function (done) {

      node.post('/api/blocks', {}, (response) => {
        console.log('response', response);
        done();
      });

    });
  });

});
