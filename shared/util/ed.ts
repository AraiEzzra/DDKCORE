const sodium = require('sodium-javascript');

interface IKeyPair {
    publicKey: any;
    privateKey: any;
}

class Ed {

    public makeKeypair(hash: string): IKeyPair {
        const keyPair: IKeyPair = {
            publicKey: Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES),
            privateKey: Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
        };

        sodium.crypto_sign_seed_keypair(keyPair.publicKey, keyPair.privateKey, hash);
        return keyPair;
    }

    public makePublicKeyHex(hash) {
        return this.makeKeypair(hash).publicKey.toString('hex');
    }

    public sign(hash: string, keyPair: IKeyPair) {
        const sig: Buffer = Buffer.alloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(sig, hash, keyPair.privateKey);
        return sig;
    }

    public verify(hash, signatureBuffer, publicKeyBuffer) {
        return sodium.crypto_sign_verify_detached(signatureBuffer, hash, publicKeyBuffer);
    }
}

export const ed = new Ed();

