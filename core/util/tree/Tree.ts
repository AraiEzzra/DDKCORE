import { Node } from 'core/util/tree/Node';

export abstract class Tree<T, INode extends Node<T>> {

    private dataToNode: Map<T, INode> = new Map();

    abstract createNode(data: T): INode;

    addNode(data: T): INode {
        const node = this.createNode(data);
        this.dataToNode.set(data, node);
        return node;
    }

    getNode(data: T): INode {
        return this.dataToNode.get(data);
    }

    removeNode(data: T): void {
        const node = this.getNode(data);
        if (node && node.parent) {
            node.parent.removeChild(node);
        }
        this.dataToNode.delete(data);
    }
}
