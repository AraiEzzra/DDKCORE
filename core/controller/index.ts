import peerController from './peer';
import blockController from './block';

import { subjectOn, subjectRpc } from 'shared/util/bus';

const controllers = [peerController, blockController];
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

export default { peerController, blockController };

