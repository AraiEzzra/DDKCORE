const chai = require('chai');
const expect = require('chai').expect;
const Logger = require('./../../logger.js');
const logger = (new Logger()).logger;
const db = require('./../../helpers/database.js');

const WebSocket = require('rpc-websockets').Client;
const modulesLoader = require('../common/initModule').modulesLoader;
const node = require('../node.js');

describe('RPC method getblocks', function () {

  const url = '/api/blocks';

  // before(function (done) { });

  describe('connect to api', function () {

    it('/api/blocks', function (done) {

      node.post(url, {}, (response) => {
        console.log('response', response);
        done();
      });

    });
  });



  /*
  const method = 'getblockscount';
  const params = { "limit": 10, "offset": 0, "sort": "height:desc" };
  const ws = new WebSocket('ws://0.0.0.0:8080');

  modulesLoader.scope.config.db.host = '0.0.0.0';
  modulesLoader.scope.config.db.password = 'password';

  let dbInstance;
  let stakeOrdersData;

  before(function (done) {

    let dbInstanceFunc = async (err, dbi) => {
      stakeOrdersData = await dbi.query('SELECT * FROM stake_orders');
      dbInstance = dbi;
      done();
    };

    db.connect(modulesLoader.scope.config.db, logger, dbInstanceFunc);

  });

  describe('connect to db', function () {
    it('should be ok', function (done) {

      const dbInstanceQueryPromise = dbInstance.query('SELECT * FROM stake_orders');
      dbInstanceQueryPromise.then(( result ) => {
        console.log('result data: ', result.length);
        done();
      });

    });
  });


  describe('open ws', function () {
    it('should be ok', function (done) {

      ws.on('open', function() {
        ws.call(method, params).then(function (result) {
          console.log('result: ', result);
          done();
        });
        ws.close();
      });

    });
  });
*/

});
