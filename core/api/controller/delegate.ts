import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { Pagination } from 'shared/util/common';
import DelegateRepository from 'core/repository/delegate';
import DelegateService from 'core/service/delegate';
import AccountRepository from 'core/repository/account';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { SerializedDelegate } from 'shared/model/delegate';
import {
    RequestDelegates,
    ResponseDelegates,
    RequestActiveDelegates,
    ResponseActiveDelegates,
} from 'shared/model/types';

class DelegateController {

    constructor() {
        this.getDelegates = this.getDelegates.bind(this);
        this.getActiveDelegates = this.getActiveDelegates.bind(this);
        this.getMyDelegates = this.getMyDelegates.bind(this);
    }

    @API(API_ACTION_TYPES.GET_DELEGATES)
    public getDelegates(
        message: Message<RequestDelegates>,
    ): ResponseEntity<ResponseDelegates> {
        const result = DelegateRepository.getMany(
            message.body.filter,
            message.body.sort,
        );

        return new ResponseEntity({
            data: {
                delegates: result.delegates.map(delegate => DelegateRepository.serialize(delegate)),
                count: result.count,
            }
        });
    }

    @API(API_ACTION_TYPES.GET_ACTIVE_DELEGATES)
    public getActiveDelegates(
        message: Message<RequestActiveDelegates>,
    ): ResponseEntity<ResponseActiveDelegates> {
        const result = DelegateService.getActiveDelegates(message.body.filter, message.body.sort);

        return new ResponseEntity({
            data: {
                ...result,
                delegates: result.delegates.map(
                    delegate => DelegateRepository.serialize(delegate),
                ),
            }
        });
    }

    @API(API_ACTION_TYPES.GET_MY_DELEGATES)
    public getMyDelegates(
        message: Message<{ address: string } & Pagination>,
    ): ResponseEntity<{ delegates: Array<SerializedDelegate>, count: number }> {

        const account = AccountRepository.getByAddress(BigInt(message.body.address));
        if (!account) {
            return new ResponseEntity({ errors: ['Account not exist'] });
        }
        const myDelegates = account.votes.map(publicKey => DelegateRepository.getDelegate(publicKey));

        return new ResponseEntity({
            data: {
                delegates: myDelegates.slice(message.body.offset, message.body.offset + message.body.limit).map(
                    delegate => DelegateRepository.serialize(delegate)
                ),
                count: myDelegates.length,
            }
        });
    }

}

export default new DelegateController();
