import DhActor from '../../documents/actor.mjs'
import DhCharacter from './character.mjs';

declare module './base.mjs' {
    export default interface BaseDataActor {
        parent: DhActor<this>;
    }
}

declare module './companion.mjs' {
    export default interface DhCompanion {
        partner: DhActor<DhCharacter>;
    }
}
