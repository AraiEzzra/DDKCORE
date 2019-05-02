import { Tree } from 'core/util/tree';
import FactorNode from 'core/repository/referredUsers/tree/FactorNode';

export default class FactorTree<T> extends Tree<T, FactorNode<T>> {

    createNode(data: T): FactorNode<T> {
        return new FactorNode<T>(data);
    }

}
