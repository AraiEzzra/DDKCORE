
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

function writeInt8(buff, int8, offset) {
    buff.writeInt8(int8, offset);
    return offset + LENGTH.BYTE;
}

function writeInt32LE(buff, int32, offset) {
    buff.writeInt32LE(int32, offset);
    return offset + LENGTH.UINT32;
}

function writeUInt64LE(buff, bigint, offset) {
    const MAX = 64;

    let bin = bigint.toString(2);
    bin = stringNullGenerator(MAX - bin.length) + bin;
    buff.writeUInt32LE(parseInt(bin.slice(0, 32), 2), offset);
    offset += 4;
    buff.writeUInt32LE(parseInt(bin.slice(32, 64), 2), offset);
    return offset + 4;
}

function writeNotNull(buff, val, offset, len) {
    if (val) {
        buff.write(val, offset, len);
    }
    return offset + len;
}


module.exports = {
    LENGTH,
    writeInt8: writeInt8,
    writeInt32LE: writeInt32LE,
    writeUInt64LE: writeUInt64LE,
    writeNotNull: writeNotNull,
    stringNullGenerator: stringNullGenerator,
};
