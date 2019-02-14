export const sortFields: string[] = [
    'username',
    'address',
    'publicKey',
    'vote',
    'missedblocks',
    'producedblocks',
    'approval',
    'productivity',
    'voters_cnt',
    'register_timestamp'
];

export class Delegate {
    username: string;
    transactionId?: string;
    publicKey?: string;
    vote?: number | bigint;
    missedblocks?: number;
    producedblocks?: number;
    url?: string;

    constructor(obj) {
        this.username = obj.username;
        this.transactionId = obj.transactionId;
        this.publicKey = obj.publicKey;
        this.vote = obj.vote;
        this.missedblocks = obj.missedblocks;
        this.producedblocks = obj.producedblocks;
        this.url = obj.url;
    }
}
