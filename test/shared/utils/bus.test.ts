import { ON } from 'core/util/decorator';
import { messageON, subjectOn } from 'shared/util/bus';
import { expect } from 'chai';
import { BaseController } from 'core/controller/baseController';

class Test extends BaseController {
    public result: string[] = [];

    @ON('topic1')
    public resolver1(message1: string = 'default message') {
        const data = 'received message on topic1:' + message1;
        this.result.push(data);
    }

    @ON('topic2')
    public resolver2(message2: []) {
        const data = 'received message on topic2:' + JSON.stringify(message2);
        this.result.push(data);
    }

    @ON('topic1')
    @ON('topic2')
    public resolver3(message3: string) {
        const data = 'received message on topic3:' + message3;
        this.result.push(data);
    }

}

describe('RxBus', () => {
    const test = new Test();
    if (test.eventsON && test.eventsON.length) {
        test.eventsON.forEach(({ handlerTopicName, handlerFunc }) => {
            subjectOn.subscribe(({ data, topicName }) => {
                if (handlerTopicName === topicName) {
                    handlerFunc.apply(test, data);
                }
            });
        });
    }

    describe('receiving message', () => {
        context('topic1', () => {
            it('should call 2 handlers', async () => {
                messageON('topic1');
                await expect(test.result.length).to.be.equal(2);
            });
        });
        context('topic2', () => {
            it('should call 2 handlers', async () => {
                messageON('topic2', ['this', 'is', 'bus']);
                await expect(test.result.length).to.be.equal(4);
            });
        });
    });
});

