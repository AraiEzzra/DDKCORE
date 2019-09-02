import { ModelType } from './../modelType';
import { MapObject } from './mapObject';

const HEADER_LENGTH = 4;

export class SimpleArray extends ModelType {
    private typeElement;

    constructor(type: MapObject) {
        super();
        this.length.head = HEADER_LENGTH;
        this.typeElement = type;
    }

    getLength(value: Array<any>) {
        return this.length.head + this.getBodyLength(value);
    }

    private getBodyLength(value: Array<any>): number {
      return value.reduce((size, item) => {
            return size + this.typeElement.getLength(item);
        }, 0);
    }

    read(buffer, offset) {
        const sizeBody = buffer.readUInt32BE(offset);
        offset += this.length.head;
        const res = [];
        const end = offset + sizeBody;

        while (offset < end) {
            const result = this.typeElement.read(buffer, offset);
            res.push(result.value);
            offset = result.offset;
        }
        return {
            value: res,
            offset: offset
        };
    }

    write(buffer, value: Array<any>, offset) {

        const sizeBody = this.getBodyLength(value);

        buffer.writeUInt32BE(sizeBody, offset);
        offset += this.length.head;
        value.forEach(element => {
            offset = this.typeElement.write(buffer, element, offset);
        });

        return offset;
    }
}
