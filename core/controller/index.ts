import BlockController from 'core/controller/block';
import RoundController from 'core/controller/round';
import SyncController from 'core/controller/sync';
import EventService from 'core/service/events';
import TransactionController from 'core/controller/transaction';
import PeerController from 'core/controller/peer';
import { filter } from 'rxjs/operators';
import System from 'core/repository/system';
import EventsQueue from 'core/repository/eventQueue';
import { subjectOn } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import { timer } from 'rxjs';
import config from 'shared/config';
import { ResponseEntity } from 'shared/model/response';

const UNLOCKED_METHODS: Set<string> = new Set(
    SyncController.eventsON.map(func => func.handlerTopicName)
);

UNLOCKED_METHODS.add('transactionsSaved');

type Event = {
    topicName: string;
    data: any;
};

const MAIN_QUEUE: Array<Event> = [];
const processMainQueue = async (): Promise<void> => {
    if (MAIN_QUEUE.length === 0) {
        return;
    }

    const event: Event = MAIN_QUEUE[MAIN_QUEUE.length - 1];
    const response: ResponseEntity<void> = await BlockController.eventsMAIN[event.topicName]
        .apply(BlockController, [event.data]);
    if (response.success) {
        logger.debug(`[processMainQueue] Main task ${event.topicName} completed successfully`);
    } else {
        const errorMessage = response.errors.join('. ');
        if (!errorMessage.includes('Block already processed')) {
            logger.error(`[processMainQueue] Main task ${event.topicName} failed: ${errorMessage}`);
        }
    }

    MAIN_QUEUE.length = MAIN_QUEUE.length - 1;
    if (MAIN_QUEUE.length) {
        setImmediate(processMainQueue);
    }
};

export const initControllers = () => {
    const controllers = [
        TransactionController,
        RoundController,
        SyncController,
        PeerController,
    ];

    const methods = new Map();

    controllers.forEach(controller => {
        if (controller.eventsON && controller.eventsON.length) {
            controller.eventsON.forEach(({ handlerTopicName, handlerFunc }) => {
                methods.set(handlerTopicName, handlerFunc);
            });
        }
    });


    subjectOn.pipe(
        filter((elem: Event) => {
            return ['BLOCK_GENERATE', 'BLOCK_RECEIVE'].indexOf(elem.topicName) !== -1;
        }),
        filter((elem: Event) => {
            if (System.synchronization && !UNLOCKED_METHODS.has(elem.topicName)) {
                EventsQueue.push({
                    data: elem.data,
                    topicName: elem.topicName,
                    type: 'MAIN',
                });
                return false;
            } else {
                return true;
            }
        }),
    ).subscribe(async ({ data, topicName }: Event) => {
        MAIN_QUEUE.unshift({ data, topicName });
        if (MAIN_QUEUE.length === 1) {
            setImmediate(processMainQueue);
        }
    });

    subjectOn.pipe(
        filter((elem: { data, topicName }) => {
            return methods.has(elem.topicName);
        })
    ).subscribe(({ data, topicName }) => {
        if (System.synchronization && !UNLOCKED_METHODS.has(topicName)) {
            EventsQueue.push({
                data: data,
                topicName: topicName,
                type: 'ON',
            });
        } else {
            setImmediate(() => methods.get(topicName)(data));
        }
    });
};

export const initShedulers = () => {
    timer(0, config.CONSTANTS.UPDATE_BLOCKCHAIN_INFO_INTERVAL).subscribe(() => {
        EventService.updateBlockchainInfo();
    });
    timer(0, config.CONSTANTS.UPDATE_SYSTEM_INFO_INTERVAL).subscribe(() => {
        EventService.updateSystemInfo();
    });
};
