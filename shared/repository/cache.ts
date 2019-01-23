export interface ICacheRepository {

    removeByPattern(pattern: string): void;

    deleteJsonForKey(key: string): void;

    hmset(hmset: string): void;

    getJsonForKey<T>(key: string): T;

    getJsonForKeyAsync<T>(key: string): T;

    setJsonForKey(key: string, value: any);

    getJsonForKeyAsync(key: string, value: any);

    flushDb(): void;

    quit(): void;

    cleanup(): void;

    connect(): void;

}

declare class Transaction {} // todo get Transaction model
export interface ICacheService {

    onFinishRound(round: number): void;

    onTransactionsSaved(transactions: Array<Transaction>): void; // todo get Transaction model

    onSyncStarted(): void; // figure it out with logic implementation

    onSyncFinished(): void; // figure it out with logic implementation

    onNewBlock(): void; // figure it out with logic implementation

    isConnected(): void; // figure it out with logic implementation

    isReady(): void; // figure it out with logic implementation

    isExists(): void; // figure it out with logic implementation

}
