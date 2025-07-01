import DHAdversaryRoll from './adversaryRoll.mjs';

export default class DHDualityRoll extends DHAdversaryRoll {
    get messageTemplate() {
        return 'systems/daggerheart/templates/chat/duality-roll.hbs';
    }
}
