import DHAdversaryRoll from './adversaryRoll.mjs';

export default class DHDualityRoll extends DHAdversaryRoll {
    get messageTemplate() {
        return 'systems/daggerheart/templates/ui/chat/duality-roll.hbs';
    }
}
