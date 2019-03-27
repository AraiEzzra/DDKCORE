import BlockController from 'core/controller/block';
import RoundController from 'core/controller/round';
import SyncController from 'core/controller/sync';
import EventsController from 'core/controller/events';
import TransactionController from 'core/controller/transaction';
import { filter, flatMap } from 'rxjs/operators';

import { subjectOn, subjectRpc } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ResponseEntity } from 'shared/model/response';
import { timer } from 'rxjs';
import config from 'shared/util/config';

export const initControllers = () => {
    const controllers = [
        BlockController,
        TransactionController,
        RoundController,
        SyncController
    ];

    subjectOn
    .pipe(
        filter((elem: { data, topicName }) =>
            ['BLOCK_GENERATE', 'BLOCK_RECEIVE'].indexOf(elem.topicName) !== -1
        ),
        flatMap(({ data, topicName }) => {
                logger.debug(`TASK MAIN ${topicName} start`);
                return fromPromise(BlockController.eventsMAIN[topicName].apply(BlockController, [data]));
            }
        )
    )
    .subscribe((data: ResponseEntity<any>) => {
        logger.debug(data.success ? 'TASK MAIN finished success' : `TASK MAIN finished with error ${data.errors}`);
    });

    controllers.forEach((controller) => {
        if (controller.eventsON && controller.eventsON.length) {
            controller.eventsON.forEach(({ handlerTopicName, handlerFunc }) => {
                subjectOn.subscribe(({ data, topicName }) => {
                    if (handlerTopicName === topicName) {
                        setImmediate(() => handlerFunc.apply(controller, [data]));
                    }
                });
            });
        }

        if (controller.eventsRPC && controller.eventsRPC.length) {
            controller.eventsRPC.forEach(({ handlerTopicName, handlerFunc }) => {
                subjectRpc.subscribe(({ data, topicName }) => {
                    if (handlerTopicName === topicName) {
                        setImmediate(() => handlerFunc.apply(controller, [data]));
                    }
                });
            });
        }
    });

};

export const initShedulers = () => {
    timer(0, config.constants.UPDATE_BLOCKCHAIN_INFO_INTERVAL).subscribe(() => {
        EventsController.updateBlockchainInfo();
    });
};
