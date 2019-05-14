import config from 'shared/config';

export class HistoryRepository<T> {
    store: Map<string, Array<T>>;

    constructor() {
        this.store = new Map();
    }

    add = (id: string, event: T) => {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        const history = this.store.get(id);

        history
            ? this.store.get(id).push(event)
            : this.store.set(id, [event]);

        return this.store.get(id);
    }

    get = (id: string): Array<T> => {
        return this.store.get(id);
    }
}
