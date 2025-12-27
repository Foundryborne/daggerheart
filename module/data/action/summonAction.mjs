import { ui } from '../../applications/_module.mjs';
import DHBaseAction from './baseAction.mjs';

export default class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tokenArray: new fields.ArrayField(new fields.SchemaField({
                actorUUID: new fields.DocumentUUIDField({ type: 'Actor', required: true }),
                count: new fields.NumberField({ required: true, default: 1, min:1 })
            }), { required: false })
        };
    }

    async trigger(event, ...args) {
        if (!this.canSummon || !canvas.scene){
            ui.notifications.error(game.i18n.localize("DAGGERHEART.ACTIONS.TYPES.summon.error"));
            return;
        }
    }

    get canSummon() {
        return game.user.can('TOKEN_CREATE');
    }
}
