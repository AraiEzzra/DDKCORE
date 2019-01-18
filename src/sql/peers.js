const PeersSql = {

    getAll: 'SELECT ip, port, state, os, version, broadhash, height, clock, (SELECT ARRAY_AGG(dappid) FROM peers_dapp WHERE "peerId" = peers.id) as dappid FROM peers',

    clear: 'DELETE FROM peers',

    addDapp: 'INSERT INTO peers_dapp ("peerId", dappid) VALUES ((SELECT id FROM peers WHERE ip = ${ip} AND port = ${port}), ${dappid}) ON CONFLICT DO NOTHING',
};

module.exports = PeersSql;
