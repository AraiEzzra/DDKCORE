import { PeerRepo } from 'core/repository/peer';

export class PeerService {
    private readonly peerRepo = new PeerRepo();

    constructor() { }

    update(headers, peer){
        this.peerRepo.peerUpdate(headers, peer);
    }
}

export default new PeerService();
