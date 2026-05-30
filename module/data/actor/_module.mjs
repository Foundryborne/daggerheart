import DhCharacter from './character.mjs';
import DhCompanion from './companion.mjs';
import DhAdversary from './adversary.mjs';
import DhNPC from './npc.mjs';
import DhEnvironment from './environment.mjs';
import DhParty from './party.mjs';

export { DhCharacter, DhCompanion, DhAdversary, DhNPC, DhEnvironment, DhParty };

export const config = {
    character: DhCharacter,
    companion: DhCompanion,
    adversary: DhAdversary,
    npc: DhNPC,
    environment: DhEnvironment,
    party: DhParty
};
