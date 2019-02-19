import blockController from './block';
import delegateController from './delegate';
import roundController from './round';
import syncController from  './sync';

import { subjectOn, subjectRpc } from 'shared/util/bus';

const controllers = [blockController, roundController, delegateController, syncController];
controllers.forEach((controller) => {
    if (controller.eventsON && controller.eventsON.length) {
        controller.eventsON.forEach(({ handlerTopicName, handlerFunc }) => {
            subjectOn.subscribe(({ data, topicName }) => {
                if (handlerTopicName === topicName) {
                    handlerFunc.apply(controller, data);
                }
            });
        });
    }

    if (controller.eventsRPC && controller.eventsRPC.length) {
        controller.eventsRPC.forEach(({ handlerTopicName, handlerFunc }) => {
            subjectRpc.subscribe(({ data, topicName }) => {
                if (handlerTopicName === topicName) {
                    handlerFunc.apply(controller, data);
                }
            });
        });
    }
});

export default {
    blockController,
    delegateController,
    roundController,
    syncController,
};
