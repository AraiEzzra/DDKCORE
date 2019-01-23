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
    transactionId: string;

    constructor(username: string, transactionId: string) {
        this.username = username;
        this.transactionId = transactionId;
    }
}
