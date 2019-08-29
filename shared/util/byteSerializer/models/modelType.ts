class MetaLength {
    readonly type: number;
    head: number;
    body: number;

    constructor() {
        this.type = 1;
        this.head = 0;
        this.body = 0;
    }
}

export abstract class ModelType {
    length: MetaLength;

    constructor() {
        this.length = new MetaLength();
    }

    public typeId: number;

    protected abstract read(buffer: Buffer, offset: number): { offset: number, value: any };

    protected abstract write(buffer: Buffer, value: any, offset: number): number;

    public create(data): Buffer {

        const length = this.getLength(data);

        const buffer = Buffer.alloc(length);

        this.write(buffer, data, 0);
        return buffer;
    }

    protected writeTypeId(buffer: Buffer, offset: number): number {
        return buffer.writeUInt8(this.typeId, offset);
    }

    abstract getLength(value?: any): number;
}
