import { Delegate } from 'shared/model/delegate';
import Response from 'shared/model/response';
import db from 'shared/driver/db';
import config from 'shared/util/config';
interface IDelegatesArray {
    delegates: Delegate[];
    totalCount?: number;
}

export interface IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<Response <{ delegate: Delegate }>>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<Response<IDelegatesArray>>;
}

export class DelegateRepository implements IDelegateRepo {

    async getDelegate(publicKey: string, username: string): Promise<Response<{ delegate: Delegate }>> {

        return new Response({
            data: {
                delegate: new Delegate('', ''),
            }
        });
    }

    async getDelegates(orderBy: string,
                       limit: number = config.constants.activeDelegates,
                       offset: number = 0): Promise<Response<IDelegatesArray>> {
        const delegates = await db.many(`
                      SELECT username,
                              address,
                              dtvc."publicKey",
                              dtvc."voteCount",
                              vote,
                              missedblocks,
                              producedblocks,
                              url,
                              count(*) OVER() AS count_delegates
                      FROM delegate_to_vote_counter as dtvc
                      INNER JOIN mem_accounts ON mem_accounts."publicKey" = dtvc."publicKey"
                      ORDER BY dtvc."voteCount" DESC, dtvc."publicKey"
                      LIMIT ${ limit }
                      OFFSET ${ offset }`
                );

        if (!delegates || delegates.length === 0) {
            return new Response({
               errors: ['Not found delegates']
            });
        }
        return new Response({
            data: {
                delegates,
                count: delegates[0].count_delegates
            }
        });
    }
}
