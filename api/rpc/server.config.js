const Block = require('./methods/block');
const Blocks = require('./methods/blocks');
const Header = require('./methods/header');
const Headers = require('./methods/headers');

const methods = [
  Block,
  Blocks,
  Header,
  Headers,
];

const PORT = 8080;
const HOST = 'localhost';
const VERSION = 1;


module.exports = {
  methods: methods,
  port: PORT,
  host: HOST,
  version: VERSION,
};