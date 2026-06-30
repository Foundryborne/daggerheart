import DhCompanion from '../../../data/actor/companion.mjs';
import DhpActor from '../../../documents/actor.mjs';

declare module './companion.mjs' {
    export default interface DhCompanionSheet {
        actor: DhpActor<DhCompanion>;
    }
}
