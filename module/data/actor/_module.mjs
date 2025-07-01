import DhCharacter from './character.mjs';
import DhCompanion from './companion.mjs';
import DhAdversary from './adversary.mjs';
import DhEnvironment from './environment.mjs';

export { DhCharacter, DhCompanion, DhAdversary, DhEnvironment };

export const config = {
    character: DhCharacter,
    companion: DhCompanion,
    adversary: DhAdversary,
    environment: DhEnvironment
};
