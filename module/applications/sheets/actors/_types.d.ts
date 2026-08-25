import DhCompanion from '../../../data/actor/companion.mjs';
import DhParty from '../../../data/actor/party.mjs';
import DhpActor from '../../../documents/actor.mjs';

declare module './companion.mjs' {
    export default interface DhCompanionSheet {
        actor: DhpActor<DhCompanion>;
        document: DhpActor<DhCompanion>;
    }
}

declare module './party.mjs' {
    export default interface PartySheet {
        actor: DhpActor<DhParty>;
        document: DhpActor<DhParty>;
    }
}

