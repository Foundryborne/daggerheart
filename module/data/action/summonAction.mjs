import DHBaseAction from './baseAction.mjs';

export default class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            summon: new fields.ArrayField(new fields.SchemaField({
                actorUUID: new fields.DocumentUUIDField({ type: 'Actor', required: true }),
                count: new fields.NumberField({ required: true, default: 1, min: 1, integer: true })
            }), { required: false, initial: [] })
        };
    }

    get defaultValues() {
        return {
             summon: { actorUUID: "", count: 1 }
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

    //Accessor for summon manager for performing the summon action
    get summonManager() {
        return game.dh.summon; //incomplete implementation
    }

    //Logic to perform the summon action - incomplete implementation
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
    }   
}
