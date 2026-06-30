import DhpActor from '../../documents/actor.mjs'
import DhCharacter from './character.mjs';

declare module './base.mjs' {
    export default interface BaseDataActor {
        parent: DhpActor<this>;
    }
}

declare module './companion.mjs' {
    export default interface DhCompanion {
        partner: DhpActor<DhCharacter>;
    }
}
