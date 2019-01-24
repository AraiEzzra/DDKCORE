
export class AccountSessions {

    private sockets: Array<any> = [];
    private static instance: AccountSessions;
    private constructor() {}

    static getInstance() {
        if (!AccountSessions.instance) {
            AccountSessions.instance = new AccountSessions();
        }
        return AccountSessions.instance;
    }

    list() {
        return this.sockets;
    }

    length() {
        return this.sockets.length;
    }

    get(address) {
        let i, sessions = [];
        for (i = 0; i < this.sockets.length; i++) {
            if (this.sockets[i].address == address) {
                sessions.push(this.sockets[i]);
            }
        }
        return sessions;
    }

    add(address, status, socketId) {
        this.sockets.push({address, status, socketId})
        return this.length();
    }

    remove(socketId) {
        this.sockets.forEach((session, index) => {
            if (session.socketId === socketId) {
                this.sockets.splice(index, 1);
            }
        });
        return this.length();
    }

}

export default exports = {
    AccountSessions
}
