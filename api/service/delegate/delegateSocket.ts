import { DelegateModel } from 'shared/model/delegate';
import { generateDelegates } from 'api/mock/delegate';
import { Filter } from 'shared/model/types';
import ResponseEntity from 'shared/model/response';
import { DelegateService } from 'api/service/delegate';
import socketCore from 'api/driver/socket/core';
import { MESSAGE_CHANNEL } from 'api/driver/socket/channel';

export class DelegateSocketService implements DelegateService {

    getActiveDelegates(filter: Filter): any {
        socketCore.emit(MESSAGE_CHANNEL, filter)
    }

    getInactiveDelegates(filter: Filter): any {
    }

}


export default new DelegateSocketService();
