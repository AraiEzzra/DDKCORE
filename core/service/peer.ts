import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';

export class PeerService {

    constructor() {
    }

    update(headers, peer) {
        PeerRepository.peerUpdate(headers, peer);
        if (PeerRepository.isBanned(peer)) {
            if (headers.height === SystemRepository.height &&
                headers.broadhash === SystemRepository.broadhash
            ) {
                PeerRepository.unban(peer);
            }
        }
    }
}

export default new PeerService();
