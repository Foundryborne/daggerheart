import DHItem from '../../documents/item.mjs';

declare module './base.mjs' {
    export default interface BaseDataItem {
        parent: DHItem<this>;
        actor: DhpActor;
    }
}