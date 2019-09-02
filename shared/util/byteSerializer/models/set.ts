import { ModelType } from './modelType';
import { BufferArray } from './array';
import { BufferTypesId } from './../types';

export class BufferSet extends ModelType {

    private typeElement;

    constructor(typeElement: ModelType) {
        super();
        this.typeId = BufferTypesId.BufferSet;

        this.typeElement = new BufferArray(typeElement);
    }

    getLength(data: Set<any>) {
        return this.length.type + this.typeElement.getLength([...data]);
    }

    read(buffer, offset) {
        offset += this.length.type;
        const result = this.typeElement.read(buffer, offset);

        return {
            value: new Set(result.value),
            offset: result.offset
        };
    }

    write(buffer, data: Set<any>, offset) {
        offset = this.writeTypeId(buffer, offset);
        return this.typeElement.write(buffer, [...data], offset);
    }
}
