import PeerRepository from 'core/repository/peer';
import { Block } from 'shared/model/block';

export class PeerService {

    constructor() { }

    update(headers, peer) {
        PeerRepository.peerUpdate(headers, peer);
    }
}

export default new PeerService();
