import BaseDataActor from '../data/actor/base.mjs'
import DHItem from './item.mjs';
import BaseDataItem from '../data/item/base.mjs';
import DhActiveEffect from './activeEffect.mjs';
import EmbeddedCollection from '@common/abstract/embedded-collection.mjs';
import DHToken from './token.mjs';
import Actor from '@client/documents/actor.mjs';
import Item from '@client/documents/item.mjs';

declare module './actor.mjs' {
    export default interface DhpActor<T extends BaseDataActor = BaseDataActor> extends Actor {
        system: T;
        items: EmbeddedCollection<DHItem>;
        effects: EmbeddedCollection<DhActiveEffect>;
        get token(): DHToken | null;

        /** @inheritdoc */
        getActiveTokens(linked?: boolean, document?: boolean): (DHToken | foundry.canvas.placeables.Token)[];
        getActiveTokens(linked?: boolean, document: true): DHToken[];
        getActiveTokens(linked?: boolean, document: false): foundry.canvas.placeables.Token[];
    }
}

declare module './item.mjs' {
    export default interface DHItem<T extends BaseDataItem = BaseDataItem> extends Item {
        parent: DhpActor;
        actor: DhpActor;
        system: T;
        effects: EmbeddedCollection<DhActiveEffect>;
    }
}