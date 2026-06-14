import BaseDataActor from '../data/actor/base.mjs'
import DHItem from './item.mjs';
import BaseDataItem from '../data/item/base.mjs';
import DhActiveEffect from './activeEffect.mjs';
import EmbeddedCollection from '@common/abstract/embedded-collection.mjs';

declare module './actor.mjs' {
    export default interface DhpActor<T extends BaseDataActor = BaseDataActor> {
        system: T;
        items: EmbeddedCollection<DHItem>;
        effects: EmbeddedCollection<DhActiveEffect>;
    }
}

declare module './item.mjs' {
    export default interface DHItem<T extends BaseDataItem = BaseDataItem> {
        parent: DhpActor;
        actor: DhpActor;
        system: T;
        effects: EmbeddedCollection<DhActiveEffect>;
    }
}