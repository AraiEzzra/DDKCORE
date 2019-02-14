import { Peer } from 'shared/model/peer';
import PeerRepo from 'api/repository/peer';

class PeerService {

    public countByFilter(): any {
        return {
            connected: 0,
            disconnected: 0,
            banned: 0
        };
    }

    public async getByFilter(filter): Promise<Peer[]> {
        return PeerRepo.list();
    }
}

export default new PeerService();
