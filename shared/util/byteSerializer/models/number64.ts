import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const SIZE = 8;
const BODY_BINARY_LENGTH = 64;
const BODY_BINARY_ALLOCATION = 32;

/* tslint:disable:no-magic-numbers */
export class Number64 extends ModelType {
    constructor() {
        super();
        this.length.body = SIZE;
        this.typeId = BufferTypesId.Number64;
    }

    private _stringNullGenerator(count: number): string {
        let str = '';
        for (let i = 0; i < count; i++) {
            str = '0' + str;
        }
        return str;
    }

    getLength() {
        return this.length.type + this.length.body;
    }

    read(buffer, offset) {

        offset += this.length.type;

        let firstPart = buffer.readUInt32BE(offset).toString(2);
        firstPart = this._stringNullGenerator(BODY_BINARY_ALLOCATION - firstPart.length) + firstPart;
        offset += 4;

        let secondPart = buffer.readUInt32BE(offset).toString(2);
        secondPart = this._stringNullGenerator(BODY_BINARY_ALLOCATION - secondPart.length) + secondPart;
        offset += 4;

        return {
            value: Number('0b' + firstPart + secondPart),
            offset
        };
    }

    write(buffer, value: number, offset) {

        let bin = (value || 0).toString(2);
        bin = this._stringNullGenerator(BODY_BINARY_LENGTH - bin.length) + bin;

        offset = this.writeTypeId(buffer, offset);

        offset = buffer.writeUInt32BE(parseInt(bin.slice(0, BODY_BINARY_ALLOCATION), 2), offset);
        return buffer.writeUInt32BE(parseInt(bin.slice(BODY_BINARY_ALLOCATION, BODY_BINARY_LENGTH), 2), offset);
    }
}
/* tslint:enable */
