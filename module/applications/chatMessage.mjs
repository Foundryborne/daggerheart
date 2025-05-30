import DhpDualityRoll from '../data/dualityRoll.mjs';
import { DualityRollColor } from '../data/settings/Appearance.mjs';

export default class DhpChatMessage extends ChatMessage {
    constructor(data, options) {
        super(data, options);

        if (
            data.type === 'dualityRoll' ||
            data.type === 'adversaryRoll' ||
            data.type === 'damageRoll' ||
            data.type === 'abilityUse'
        ) {
            this.#templateInjection(data);
        }
    }

    async #templateInjection(data) {
        return await foundry.applications.handlebars.renderTemplate(data.content, data.system);
    }

    async renderHTML() {
        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML();

        if (
            this.type === 'dualityRoll' &&
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).dualityColorScheme ===
                DualityRollColor.colorful.value
        ) {
            html.classList.add('duality');
            const dualityResult = this.system.dualityResult;
            if (dualityResult === DhpDualityRoll.dualityResult.hope) html.classList.add('hope');
            else if (dualityResult === DhpDualityRoll.dualityResult.fear) html.classList.add('fear');
            else html.classList.add('critical');
        }

        return html;
    }
}
