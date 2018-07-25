const Block = require('./methods/block');
const Header = require('./methods/header');

const methods = [
  Block,
  Header,
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