import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { Pagination } from 'api/utils/common';
import DelegateRepository from 'core/repository/delegate';
import AccountRepository from 'core/repository/account';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import Config from 'shared/util/config';


class DelegateController {

    constructor() {
        this.getDelegates = this.getDelegates.bind(this);
        this.getActiveDelegates = this.getActiveDelegates.bind(this);
        this.getMyDelegates = this.getMyDelegates.bind(this);
    }

    @API(API_ACTION_TYPES.GET_DELEGATES)
    public getDelegates(message: Message2<Pagination>): ResponseEntity<{ delegates: Array<object>, count: number }> {
        return new ResponseEntity({
            data: {
                delegates: DelegateRepository.getDelegates(message.body.limit, message.body.offset).map(
                    delegate => DelegateRepository.serialize(delegate)
                ),
                count: DelegateRepository.getCount(),
            }
        });
    }

    @API(API_ACTION_TYPES.GET_ACTIVE_DELEGATES)
    public getActiveDelegates(message: Message2<Pagination>): 
        ResponseEntity<{ delegates: Array<object>, count: number }> {
        return new ResponseEntity({
            data: {
                delegates: DelegateRepository.getActiveDelegates(message.body.limit, message.body.offset).map(
                    delegate => DelegateRepository.serialize(delegate)
                ),
                count: Math.min(Config.constants.activeDelegates, DelegateRepository.getCount()),
            }
        });
    }

    @API(API_ACTION_TYPES.GET_MY_DELEGATES)
    public getMyDelegates(message: Message2<{ address: string } & Pagination>):
        ResponseEntity<{ delegates: Array<object>, count: number }> {

        const account = AccountRepository.getByAddress(BigInt(message.body.address));
        if (!account) {
            return new ResponseEntity({ errors: ['Account not exist'] });
        }
        const myDelegates = account.votes.map(publicKey => DelegateRepository.getDelegate(publicKey));

        return new ResponseEntity({
            data: {
                delegates: myDelegates.splice(message.body.offset, message.body.limit).map(
                    delegate => DelegateRepository.serialize(delegate)
                ),
                count: myDelegates.length,
            }
        });
    }

}

export default new DelegateController();
