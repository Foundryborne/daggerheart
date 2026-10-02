import DhCharacter from '../../../data/actor/character.mjs';
import DhCompanion from '../../../data/actor/companion.mjs';
import DhParty from '../../../data/actor/party.mjs';
import DhActor from '../../../documents/actor.mjs';

declare module './companion.mjs' {
    export default interface CompanionSheet {
        actor: DhActor<DhCompanion>;
        document: DhActor<DhCompanion>;
    }
}

declare module './character.mjs' {
    export default interface CharacterSheet {
        actor: DhActor<DhCharacter>;
        document: DhActor<DhCharacter>;
    }
}

declare module './party.mjs' {
    export default interface PartySheet {
        actor: DhActor<DhParty>;
        document: DhActor<DhParty>;
    }
}

