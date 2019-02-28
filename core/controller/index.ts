import BlockController from './block';
import DelegateController from './delegate';
import RoundController from './round';
import SyncController from './sync';
import TransactionController from './transaction';

import { subjectOn, subjectRpc } from 'shared/util/bus';

export const initControllers = () => {
    const controllers = [
        BlockController,
        TransactionController,
        RoundController,
        DelegateController,
        SyncController
    ];

    controllers.forEach((controller) => {
        if (controller.eventsON && controller.eventsON.length) {
            controller.eventsON.forEach(({ handlerTopicName, handlerFunc }) => {
                subjectOn.subscribe(({ data, topicName }) => {
                    if (handlerTopicName === topicName) {
                        handlerFunc.apply(controller, [data]);
                    }
                });
            });
        }

        if (controller.eventsRPC && controller.eventsRPC.length) {
            controller.eventsRPC.forEach(({ handlerTopicName, handlerFunc }) => {
                subjectRpc.subscribe(({ data, topicName }) => {
                    if (handlerTopicName === topicName) {
                        handlerFunc.apply(controller, [data]);
                    }
                });
            });
        }
    });

};

export default {
    BlockController,
    DelegateController,
    RoundController,
    SyncController,
};
