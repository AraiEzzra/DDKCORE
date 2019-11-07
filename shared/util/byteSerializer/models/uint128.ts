import { ModelType } from './modelType';
import { BufferTypesId } from './../types';

const BODY_BINARY_LENGTH = 128;
const BODY_BINARY_ALLOCATION = 32;

const BODY_BYTE_LENGTH = 16;
const BODY_BYTE_ALLOCATION = 4;

/* tslint:disable:no-magic-numbers */
export class Uint128 extends ModelType {
    constructor() {
        super();
        this.length.body = BODY_BYTE_LENGTH;
        this.typeId = BufferTypesId.Uint128;
    }

    private _stringNullGenerator(count: number): string {
        let str = '';
        for (let i = 0; i < count; i++) {
            str = '0' + str;
        }
        return str;
    }

    read(buffer, offset) {
        offset += this.length.type;

        const values: Array<Buffer> = [];

        for (let i = 0; i < BODY_BYTE_LENGTH / BODY_BYTE_ALLOCATION; i++) {
            let value = buffer.readUInt32BE(offset).toString(2);
            value = this._stringNullGenerator(BODY_BINARY_ALLOCATION - value.length) + value;
            values.push(value);
            offset += BODY_BYTE_ALLOCATION;
        }
        return {
            value: BigInt('0b' + values.join('')),
            offset: offset
        };
    }

    write(buffer, value: number, offset: number): number {
        let bin = (value || 0).toString(2);
        bin = this._stringNullGenerator(BODY_BINARY_LENGTH - bin.length) + bin;

        offset = this.writeTypeId(buffer, offset);

        let point = 0;
        while (point < BODY_BINARY_LENGTH) {
            offset = buffer.writeUInt32BE(parseInt(bin.slice(point, point += BODY_BINARY_ALLOCATION), 2), offset);
        }

        return offset;
    }

    getLength(value) {
        return this.length.type + this.length.body;
    }
}

/* tslint:disable:no-magic-numbers */
