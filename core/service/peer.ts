interface IPeersCount {
    connected: number;
    disconnected: number;
    banned: number;
}

export class Peer {
    private modules;

    constructor(scope) {
        this.modules = scope.modules;
    }

    /**
     * @implements this.countByFilter but should be rewritten
     * @returns {IPeersCount}
     */
    public count(): IPeersCount {
        return {
            connected: 0,
            disconnected: 0,
            banned: 0
        };
    }

    public getPeers(): object {
        return {};
    }
}
