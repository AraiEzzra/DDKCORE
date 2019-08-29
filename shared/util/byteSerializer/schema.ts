import { SchemaName } from './config';

class Schema {
    storeScheme: Map<SchemaName, Object>;

    constructor() {
        this.storeScheme = new Map();
    }

    add(schemaId: SchemaName, scheme: Object) {
        if (!this.storeScheme.has(schemaId)) {
            this.storeScheme.set(schemaId, scheme);
            return true;
        }
        return false;
    }

    get(schemaId: SchemaName): Object {
        return this.storeScheme.get(schemaId);
    }
}

export const schemaStore = new Schema();
