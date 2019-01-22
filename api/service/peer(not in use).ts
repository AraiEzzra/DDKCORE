import { Peer } from 'shared/model/peer';
import { PeerRepo } from 'api/repository/peer';

export class PeerService {
    private peerRepo = new PeerRepo();

    constructor() { }

    public countByFilter(): any {
        return {
            connected: 0,
            disconnected: 0,
            banned: 0
        };
    }

    public async getByFilter(filter): Promise<Peer[]> {
        return this.peerRepo.list();
    }
}
