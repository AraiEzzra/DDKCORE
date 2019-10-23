import { timer } from 'rxjs';
import { filter } from 'rxjs/operators';

import BlockController from 'core/controller/block';
import RoundController from 'core/controller/round';
import SyncController from 'core/controller/sync';
import EventService from 'core/service/events';
import TransactionController from 'core/controller/transaction';
import PeerController from 'core/controller/peer';
import System from 'core/repository/system';
import EventsQueue from 'core/repository/eventQueue';
import { subjectOn, MainTasks } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import config from 'shared/config';
import { ResponseEntity } from 'shared/model/response';

type Event = {
    topicName: string;
    data: any;
};

const UNLOCKED_METHODS: Set<string> = new Set([
    ...SyncController.eventsON.keys(),
    ...PeerController.eventsON.keys()
]);

const mainQueueMethods: Map<string, Function> = new Map([
    ...BlockController.eventsMAIN,
    ...SyncController.eventsMAIN
]);


const MAIN_QUEUE: Array<Event> = [];

const processMainQueue = async (): Promise<void> => {
    if (MAIN_QUEUE.length === 0) {
        return;
    }

    const event: Event = MAIN_QUEUE[MAIN_QUEUE.length - 1];

    if (mainQueueMethods.has(event.topicName)) {
        try {
            const response: ResponseEntity<void> = await mainQueueMethods.get(event.topicName)(event.data);
            if (response.success) {
                logger.debug(`[processMainQueue] Main task ${event.topicName} completed successfully`);
            } else {
                const errorMessage = response.errors.join('. ');
                if (!errorMessage.includes('Block already processed')) {
                    logger.debug(`[processMainQueue] Main task ${event.topicName} failed: ${errorMessage}`);
                }
            }
        } catch (e) {
            logger.error(`[Controller][Index][processMainQueue] Main task ${event.topicName} error ${e.stack}`);
        }
    }

    MAIN_QUEUE.length -= 1;
    if (MAIN_QUEUE.length) {
        setImmediate(processMainQueue);
    }
};

export const initControllers = () => {

    const onMethods = new Map([
        ...TransactionController.eventsON,
        ...RoundController.eventsON,
        ...SyncController.eventsON,
        ...PeerController.eventsON,
    ]);


    subjectOn.pipe(
        filter((elem: Event) => {
            return [
                MainTasks.BLOCK_GENERATE,
                MainTasks.BLOCK_RECEIVE,
                MainTasks.EMIT_SYNC_BLOCKS,
            ].indexOf(elem.topicName as MainTasks) !== -1;
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
            return onMethods.has(elem.topicName);
        })
    ).subscribe(({ data, topicName }) => {
        if (System.synchronization && !UNLOCKED_METHODS.has(topicName)) {
            EventsQueue.push({
                data,
                topicName,
                type: 'ON',
            });
        } else {
            setImmediate(() => {
                try {
                    onMethods.get(topicName)(data);
                } catch (e) {
                    logger.error(`[Controller][Index][processQueue] task ON ${topicName} error ${e.stack}`);
                }
            });
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
