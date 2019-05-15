import config from 'shared/config';

export type EntityWithId = {
    id?: string;
};

export type History<Entity extends EntityWithId, EventType> = {
    entity: Entity,
    events: Array<EventType>,
};

export class HistoryRepository<Entity extends EntityWithId, EventType> {
    store: Map<string, History<Entity, EventType>>;

    constructor() {
        this.store = new Map();
    }

    addEvent(entity: Entity, event: EventType): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        console.log(`entity.id`, entity.id, `event`, event);

        if (this.store.get(entity.id)) {
            this.store.get(entity.id).events.push(event);
        } else {
            this.store.set(entity.id, { entity, events: [event] });
        }
    }

    get(id: string): History<Entity, EventType> {
        return this.store.get(id);
    }
}
