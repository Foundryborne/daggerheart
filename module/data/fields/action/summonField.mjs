import DHSummonDialog from '../../../applications/dialogs/summonDialog.mjs';

const fields = foundry.data.fields;

export default class DHSummonField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 120;

    constructor(options = {}, context = {}) {
        const summonFields = {
            summon: new fields.ArrayField(new fields.SchemaField({
                actorUUID: new fields.DocumentUUIDField({ 
                    type: 'Actor', 
                    required: true }),
                count: new fields.NumberField({ 
                    required: true, 
                    default: 1, 
                    min: 1, 
                    integer: true })
            }), { required: false, initial: [] })
        };
        super(summonFields, options, context);
    }

    /**
     * Summon Action Workflow part.
     * Must be called within Action context or similar.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    static async execute(config) {
        const selected = await DHSummonDialog.configure(config, this.item);
        if (!selected) return false;    
        return await DHSummonField.summon.call(this, selected);
    }
    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    prepareConfig(config) {
        if (!canvas.scene){    
            ui.notifications.warn(game.i18n.localize("DAGGERHEART.ACTIONS.TYPES.summon.error"));
            return false;
        }
        return true;
    }
    /**
     * Logic to perform the summon action - incomplete implementation
     */
    
    get defaultValues() {
        return {
             summon: { actorUUID: "", count: 1 }
        };
    }
    get canSummon() {
        return game.user.can('TOKEN_CREATE');
    }
}