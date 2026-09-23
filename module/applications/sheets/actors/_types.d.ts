import DhCompanion from '../../../data/actor/companion.mjs';
import DhParty from '../../../data/actor/party.mjs';
import DhActor from '../../../documents/actor.mjs';

declare module './companion.mjs' {
    export default interface CompanionSheet {
        actor: DhActor<DhCompanion>;
        document: DhActor<DhCompanion>;
    }
}

declare module './party.mjs' {
    export default interface PartySheet {
        actor: DhActor<DhParty>;
        document: DhActor<DhParty>;
    }
}

