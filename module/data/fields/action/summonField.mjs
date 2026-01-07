const fields = foundry.data.fields;
import DHSummonDialog from '../../../applications/dialogs/summonDialog.mjs';

export default class DHSummonField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 120;

    constructor(options = {}, context = {}) {
        const summonFields = new fields.SchemaField({
            actorUUID: new fields.DocumentUUIDField({
                type: 'Actor',
                required: true
            }),
            count: new fields.NumberField({
                required: true,
                default: 1,
                min: 1,
                integer: true
            })
        });
        super(summonFields, options, context);
    }

    static async execute() {
        if(!canvas.scene){
            ui.notifications.warn(game.i18n.localize("DAGGERHEART.ACTIONS.TYPES.summon.error"));
            return;
        }
        const validSummons = this.summon.filter(entry => entry.actorUUID);
        if (validSummons.length === 0) {
            console.log("No actors configured for this Summon action.");
            return;
        }
        // FOR NOW: Just log the data to prove the schema working or not
        console.group("Summon Action Triggered");
        for (const entry of validSummons) {
            const actor = await fromUuid(entry.actorUUID);
            console.log(`- Ready to summon ${entry.count}x [${actor?.name || "Unknown Actor"}]`);
        }
        console.groupEnd();
        //Open Summon Dialog
        const summonData = { summons: validSummons };
        console.log(summonData);
        const dialog = new DHSummonDialog(summonData);
        dialog.render(true);
    }
}
