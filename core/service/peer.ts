import PeerRepository from 'core/repository/peer';

export class PeerService {

    constructor() { }

    update(headers, peer) {
        PeerRepository.peerUpdate(headers, peer);
    }
}

export default new PeerService();
