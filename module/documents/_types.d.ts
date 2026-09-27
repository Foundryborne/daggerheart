import BaseDataActor from '../data/actor/base.mjs'
import DhItem from './item.mjs';
import BaseDataItem from '../data/item/base.mjs';
import DhActiveEffect from './activeEffect.mjs';
import EmbeddedCollection from '@common/abstract/embedded-collection.mjs';
import DhTokenDocument from './token.mjs';
import Actor from '@client/documents/actor.mjs';
import Item from '@client/documents/item.mjs';
import BaseEffect from '../data/activeEffect/baseEffect.mjs';
import DhTokenPlaceable from '../canvas/placeables/token.mjs';

// ClientDocument is not exposed by foundry, and mixin props are not part of the normal types
interface ClientDocument {
    get isOwner(): boolean;
}

declare module './actor.mjs' {
    export default interface DhActor<T extends BaseDataActor = BaseDataActor> extends ClientDocument, Actor {
        name: string;
        img: string;
        system: T;
        items: EmbeddedCollection<DhItem>;
        effects: EmbeddedCollection<DhActiveEffect>;
        get token(): DhTokenDocument | null;

        /** @inheritdoc */
        getActiveTokens(linked?: boolean, document?: boolean): (DhTokenDocument | foundry.canvas.placeables.Token)[];
        getActiveTokens(linked?: boolean, document: true): DhTokenDocument[];
        getActiveTokens(linked?: boolean, document: false): foundry.canvas.placeables.Token[];
    }
}

declare module './item.mjs' {
    export default interface DhItem<T extends BaseDataItem = BaseDataItem> extends ClientDocument, Item {
        name: string;
        img: string;
        parent: DhActor;
        actor: DhActor;
        system: T;
        effects: EmbeddedCollection<DhActiveEffect>;
        _stats: {
            compendiumSource?: string;
            duplicateSource?: string;
        }
    }
}

declare module './activeEffect.mjs' {
    export default interface DhActiveEffect extends foundry.documents.ActiveEffect {
        system: BaseEffect;
    }
}

declare module './scene.mjs' {
    export default interface DhScene extends foundry.documents.Scene {
        tokens: EmbeddedCollection<DhTokenDocument>;
    }
}

declare module './token.mjs' {
    export default interface DhTokenDocument extends foundry.documents.TokenDocument {
        actor: DhActor;
        object: DhTokenPlaceable;
    }
}