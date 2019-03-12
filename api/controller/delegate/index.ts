import { RPC } from 'api/utils/decorators';
import coreSocketClient from 'api/driver/socket/core';
import { MESSAGE_CHANNEL } from 'shared/driver/socket/channels';
import { Message } from 'shared/model/message';

export class DelegateController {

    // TODO: Add validation of request
    @RPC('GET_ACTIVE_DELEGATES')
    getActiveDelegates(message: Message) {
        coreSocketClient.emit(MESSAGE_CHANNEL, message);
    }

    @RPC('GET_INACTIVE_DELEGATES')
    getInactiveDelegates(message: Message) {
        coreSocketClient.emit(MESSAGE_CHANNEL, message);
    }

}

export default new DelegateController();
