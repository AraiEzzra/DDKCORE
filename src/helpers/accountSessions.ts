import Logger from 'src/logger.js';


export class AccountSessions {

    private sessions: object = {};
    private logger: Logger = new Logger().logger;
    private static io: any;
    private static instance: AccountSessions;
    private constructor() {}

    static setIOInstance(io: object) {
        AccountSessions.io = io;
    }

    static getInstance() {
        if (!AccountSessions.instance) {
            AccountSessions.instance = new AccountSessions();
        }
        return AccountSessions.instance;
    }

    put(address: string, socketId: string) {
        if (!this.sessions[address]) {
            this.sessions[address] = new Set();
        }
        this.sessions[address].add(socketId);
    }

    get length() {
        return Object.values(this.sessions).length;
    }

    get(address: string): Set<string> {
        return this.sessions[address];
    }

    remove(socketId: string, address?: string) {
        if (this.sessions[address]) {
            this.sessions[address].delete(socketId);

            if (!this.sessions[address].size) {
                delete this.sessions[address];
            }
        }
    }

    send(address: string, eventName: string, message: object) {
        if (this.sessions[address]) {
            this.sessions[address].forEach((socketId) => {
                let sessionConnection: any = AccountSessions.io.sockets.sockets[socketId];
                if (sessionConnection && sessionConnection.connected) {
                    try {
                        sessionConnection.emit(eventName, JSON.stringify(message));
                    } catch (err) {
                        this.logger.error(`Error send message by socketId on "${address}" `, { message: err.message });
                    }
                } else {
                    this.remove(socketId, address);
                }
            });
        }
    }

}

export default exports = {
    AccountSessions
}
