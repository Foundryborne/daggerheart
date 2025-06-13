import { DualityRollColor } from '../data/settings/Appearance.mjs';
import DHDualityRoll from '../data/chat-message/dualityRoll.mjs';

export default class DhpChatMessage extends foundry.documents.ChatMessage {
    async renderHTML() {
        if (this.type === 'dualityRoll' || this.type === 'adversaryRoll') {
            this.content = await foundry.applications.handlebars.renderTemplate(this.content, this.system);
        }

        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML();

        if (
            this.type === 'dualityRoll'
        ) {
            html.classList.add('duality');
            const dualityResult = this.system.dualityResult;
            if (dualityResult === DHDualityRoll.dualityResult.hope) html.classList.add('hope');
            else if (dualityResult === DHDualityRoll.dualityResult.fear) html.classList.add('fear');
            else html.classList.add('critical');
        }

        return html;
    }
}
