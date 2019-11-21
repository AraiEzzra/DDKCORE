export enum JSSpecialValues {
    null = 1,
    undefined = 2,
}

/* tslint:disable:no-magic-numbers */
const JSSpecialValuesMap = new Map([
    [null, 1],
    [1, null],
    [undefined, 2],
    [2, undefined],
]);
/* tslint:enable */

class JSSpecialTypes {
    private _values;

    private _length = 1;

    constructor() {
        this._values = JSSpecialValuesMap;
    }

    read(buffer, offset) {
        const specialTypeId = buffer.readUInt8(offset);
        let value = null;
        let isSpecial = false;

        offset += this._length;

        if (this.has(specialTypeId)) {
            value = this._values.get(specialTypeId);
            isSpecial = true;
        }
        return {
            value,
            offset,
            isSpecial,
        };
    }

    write(buffer, value: string | number | JSSpecialValues, offset): number {

        if (this.has(value)) {
            buffer.writeUInt8(this._values.get(value), offset);
        }
        return offset + this._length;
    }

    has(value): boolean {
        return JSSpecialValuesMap.has(value);
    }

    getLength(): number {
        return this._length;
    }

}
export default new JSSpecialTypes();
