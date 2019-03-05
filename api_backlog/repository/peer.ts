import { Peer } from 'shared/model/peer';
import { IPeerRepo } from 'shared/repository/peer';

class PeerRepo implements IPeerRepo {

    public async list(): Promise<Peer[]> {
        return [];
    }

}

export default new PeerRepo();
