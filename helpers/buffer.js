
const LENGTH = {
  BYTE: 1,
  UINT32: 4,
  INT64: 8,
  HEX: 32,
  DOUBLE_HEX: 64
};

function stringNullGenerator(count) {
  let str = '';
  for (let i = 0; i < count; i++) {
    str = str + '0';
  }
  return str;
}

function writeUInt64LE(buff, bigint, offset) {
  const MAX = 64;

  let bin = bigint.toString(2);
  bin = stringNullGenerator(MAX - bin.length) + bin;
  buff.writeUInt32LE(parseInt(bin.slice(0, 32), 2), offset);
  offset += 4;
  buff.writeUInt32LE(parseInt(bin.slice(32, 64), 2), offset);
  offset += 4;
  return offset;
}



module.exports = {
  LENGTH,
  writeUInt64LE: writeUInt64LE,
  stringNullGenerator: stringNullGenerator,
};
