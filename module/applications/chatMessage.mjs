import { DualityRollColor } from '../config/settingsConfig.mjs';
import DhpDualityRoll from '../data/dualityRoll.mjs';

export default class DhpChatMesssage extends ChatMessage {
    async renderHTML() {
        if (
            this.type === 'dualityRoll' ||
            this.type === 'adversaryRoll' ||
            this.type === 'damageRoll' ||
            this.type === 'abilityUse'
        ) {
            this.content = await foundry.applications.handlebars.renderTemplate(this.content, this.system);
        }

        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML();
        if (
            this.type === 'dualityRoll' &&
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.DualityRollColor) ===
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
