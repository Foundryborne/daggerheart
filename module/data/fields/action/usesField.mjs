import FormulaField from '../formulaField.mjs';

const fields = foundry.data.fields;

export default class UsesField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 160;

    /** @inheritDoc */
    constructor(options = {}, context = {}) {
        const usesFields = {
            value: new fields.NumberField({ nullable: true, initial: null }),
            max: new FormulaField({ nullable: true, initial: null, deterministic: true }),
            recovery: new fields.StringField({
                choices: CONFIG.DH.GENERAL.refreshTypes,
                initial: null,
                nullable: true
            }),
            consumeOnSuccess: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.consumeOnSuccess.label'
            })
        };
        super(usesFields, options, context);
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {MoveContext} config   Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @returns {boolean}       Return false if fast-forwarded and no more uses.
     */
    prepareConfig(config) {
        config.uses = this.uses?.max ? foundry.utils.deepClone(this.uses) : null;
        return true;
    }
}
