export {}; // top level import/export required or types don't work

declare module './base-actor.mjs' {
    export default interface DHBaseActorSheet<T extends DhActor = DhActor> {
        actor: T;
        document: T;
    }
}

declare module './base-item.mjs' {
    export default interface DHBaseItemSheet<T extends DhItem = DhItem> {
        item: T;
        document: T;
    }
}