import { Tree } from 'core/util/tree';
import FactorNode from 'core/repository/referredUsers/tree/FactorNode';
import config from 'shared/config';

export default class FactorTree<T> extends Tree<T, FactorNode<T>> {

    createNode(data: T): FactorNode<T> {
        return new FactorNode<T>(data);
    }

    eachParents(node: FactorNode<T>, cb: (parent: FactorNode<T>, level: number) => void) {
        let parent = node.parent;
        for (let level = 1; level <= config.CONSTANTS.REFERRAL.MAX_COUNT; level++) {
            if (parent === null) {
                break;
            }
            cb(parent, level);
            parent = parent.parent;
        }

    }
}
