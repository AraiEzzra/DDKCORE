interface IPeersCount {
    connected: number;
    disconnected: number;
    banned: number;
}

interface IPeerVersion {
    build: string;
    commit: string;
    version: string;
    minVersion: string;
}

interface IPeersRequest {
    body: {
        ip?: string;
        port?: number;
        state?: number;
        os?: string;
        version?: string;
        broadhash?: number;
        height?: number;
        orderBy?: string;
        limit?: number;
        offset?: number;
    };
}

interface IPeerRequest {
    body: {
        ip: string;
        port: number;
    };
}

import { Peer } from 'shared/model/peer';
import PeerService from 'api/service/peer';
import { Controller, GET } from "api/util/http_decorator";

@Controller('/peers')
class PeerController {

    /**
     * @deprecated
     */
    @GET('/count')
    public count(): IPeersCount {
        return PeerService.countByFilter();
    }

    /**
     * @deprecated
     */
    @GET('/')
    public async getPeers(req: IPeersRequest): Promise<Peer[]> {
        return await PeerService.getByFilter(req.body);
    }

    /**
     * @deprecated
     */
    @GET('/get')
    public async getPeer(req: IPeerRequest): Promise<Peer> {
        return await PeerService.getByFilter( {
            ip: req.body.ip,
            port: req.body.port
        })[0];
    }

    @GET('/version')
    public version(): IPeerVersion {
        return {
            build: '',
            commit: '',
            version: '',
            minVersion: ''
        };
    }
}

export default new PeerController();
