import BlockController from './block';
import DelegateController from './delegate';
import RoundController from './round';
import SyncController from './sync';
import TransactionController from './transaction';
import { filter } from 'rxjs/operators';

import { subjectOn, subjectRpc } from 'shared/util/bus';
import { logger } from 'shared/util/logger';

export const initControllers = () => {
    const controllers = [
        BlockController,
        TransactionController,
        RoundController,
        DelegateController,
        SyncController
    ];

    console.log(JSON.stringify(BlockController.eventsMAIN));
    subjectOn
    .pipe(
        filter((elem: { data, topicName }) =>
            ['BLOCK_GENERATE', 'BLOCK_RECEIVE'].indexOf(elem.topicName) !== -1
        )
    )
    .subscribe(async ({ data, topicName }) => {
        logger.debug(`TASK MAIN ${topicName} start`);
        await BlockController.eventsMAIN[topicName].apply(BlockController, [data]);
        logger.debug(`TASK MAIN ${topicName} finish`);
    });

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
