import DhCharacter from './character.mjs';
import DhCompanion from './companion.mjs';
import DhAdversary from './adversary.mjs';
import DhEnvironment from './environment.mjs';
import DhParty from './party.mjs';

export { DhCharacter, DhCompanion, DhAdversary, DhEnvironment, DhParty };

export const config = {
    character: DhCharacter,
    companion: DhCompanion,
    adversary: DhAdversary,
    environment: DhEnvironment,
    party: DhParty
};
