import DHSummonField from '../fields/action/summonField.mjs';
import DHBaseAction from './baseAction.mjs';
import DHSummonDialog from '../../applications/dialogs/summonDialog.mjs';

export default class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            summon: new DHSummonField({ required: false, initial: [] })
        };
    }

    static extraSchemas=[...super.extraSchemas,'summon'];

    get defaultValues() {
        return {
             summon: []
        };
    }

    async trigger(event, ...args) {
        if (!this.canSummon || !canvas.scene){
            ui.notifications.warn(game.i18n.localize("DAGGERHEART.ACTIONS.TYPES.summon.error"));
            return;
        }
        await this._performAction();
    }

    get canSummon() {
        return game.user.can('TOKEN_CREATE');
    }

    async _performAction(event, ...args) {
        const validSummons = this.summon.filter(entry => entry.actorUUID);
        if (validSummons.length === 0) {
            ui.notifications.warn("No actors configured for this Summon action.");
            return;
        }
        // FOR NOW: Just log the data to prove the schema working or not
        console.group("Summon Action Triggered");

        for (const entry of validSummons) {
            const actor = await fromUuid(entry.actorUUID);
            console.log(`- Ready to summon ${entry.count}x [${actor?.name || "Unknown Actor"}]`);
        }
        console.groupEnd();

        //Todo: Open Summon Dialog
    }
}