const env = process.env;
export default {
    peers: {
        list: (env.PEERS || '').split(',').map(peer => peer.split(':')).map(([ip, port]) => ({ ip, port })),
    },

    blackList: (env.PEERS_BLACKLIST || '').split(','),

    host: env.SERVER_HOST,
    port: env.SERVER_PORT,
};
