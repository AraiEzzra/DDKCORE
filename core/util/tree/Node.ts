export class Node<T> {

    data: T;

    parent: this | null;

    children: Map<T, this>;

    constructor(data: T) {
        this.data = data;
        this.children = new Map();
        this.parent = null;
    }

    addChild(node: this) {
        node.parent = this;
        this.children.set(node.data, node);
    }

    removeChild(node: this) {
        this.children.delete(node.data);
    }
}
