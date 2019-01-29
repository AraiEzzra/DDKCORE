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
        let counter: number = 0;
        Object.values(this.sessions).forEach(stack => counter += stack.size);
        return counter;
    }

    get(address: string): Set<string> {
        return this.sessions[address];
    }

    remove(socketId: string, address: string) {
        this.sessions[address].delete(socketId);
    }

    send(address: string, eventName: string, message: object) {
        if (this.sessions[address] instanceof Set) {
            this.sessions[address].forEach((socketId) => {
                if (AccountSessions.io.sockets.sockets[socketId]) {
                    try {
                        AccountSessions.io.sockets.sockets[socketId].emit(eventName, JSON.stringify(message));
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
