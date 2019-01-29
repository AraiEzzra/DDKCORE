import Logger from 'src/logger.js';


export class AccountSessions {

    private sessions: object = {};
    private logger: Logger = new Logger().logger;
    private static io: any;
    private static instance: AccountSessions;
    private constructor() { }

    static setIOInstance(io: object) {
        AccountSessions.io = io;
    }

    static getInstance() {
        if (!AccountSessions.instance) {
            AccountSessions.instance = new AccountSessions();
        }
        return AccountSessions.instance;
    }

    put(address: string, status: string, socketId: string) {
        if (!this.sessions[address]) {
            this.sessions[address] = [];
        }
        this.sessions[address].push({address, status, socketId});

        return this.count();
    }

    get(address) {
        let sessions: Array<object> = [];

        if (Array.isArray(this.sessions[address])) {
            let i: number;
            for (i = 0; i < this.sessions[address].length; i++) {
                if (this.sessions[address][i].address === address) {
                    sessions.push(this.sessions[address][i]);
                }
            }
        }

        return sessions;
    }

    remove(socketId: string, address?: string) {
        if (address) {
            if (Array.isArray(this.sessions[address])) {
                this.sessions[address].forEach((session, index) => {
                    if (session.socketId === socketId) {
                        this.sessions[address].splice(index, 1);
                    }
                });
            }
        } else {
            let address: string;
            for (address in this.sessions) {
                this.remove(socketId, address);
            }
        }

        return this.count();
    }

    count() {
        let address: string, counter: number = 0;
        for (address in this.sessions) {
            counter += Array.isArray(this.sessions[address])
                ? this.sessions[address].length
                : 0;
        }

        return counter
    }

    send(address: string, eventName: string, message: object) {
        const sessions: Array<object> = this.get(address);

        sessions.forEach((session) => {
            try {
                AccountSessions.io.sockets.sockets[session['socketId']].emit(eventName, JSON.stringify(message));
            } catch (err) {
                this.logger.error(`Error send message by socketId on "${address}" `, { message: err.message });
            }
        });
    }

}


export default exports = {
    AccountSessions
}
