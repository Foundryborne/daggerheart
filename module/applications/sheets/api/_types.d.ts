export {}; // top level import/export required or types don't work

declare module './base-actor.mjs' {
    export default interface DHBaseActorSheet<T extends DhpActor> {
        actor: T;
        document: T;
    }
}

declare module './base-item.mjs' {
    export default interface DHBaseItemSheet {
        item: DHItem;
        document: DHItem;
    }
}