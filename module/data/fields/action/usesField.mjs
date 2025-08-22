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
     * Uses Consumption Action Workflow part.
     * Increment Action spent uses by 1.
     * Must be called within Action context or similar or similar.
     * @param {object} config                   Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {boolean} [successCost=false]     Consume only resources configured as "On Success only" if not already consumed.
     */
    static async execute(config, successCost = false) {
        if (
            config.uses?.enabled &&
            ((!successCost && (!config.uses?.consumeOnSuccess || config.roll?.success)) ||
                (successCost && config.uses?.consumeOnSuccess))
        )
            this.update({ 'uses.value': this.uses.value + 1 });
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {object} config   Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @returns {boolean}       Return false if fast-forwarded and no more uses.
     */
    prepareConfig(config) {
        const uses = this.uses?.max ? foundry.utils.deepClone(this.uses) : null;
        if (uses && !uses.value) uses.value = 0;
        config.uses = uses;
        const hasUses = UsesField.hasUses.call(this, config.uses);
        if (config.dialog.configure === false && !hasUses) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.actionNoUsesRemaining'));
            return hasUses;
        }
    }

    /**
     * Prepare Uses object for Action Workflow
     * Must be called within Action context.
     * @param {object} uses 
     * @returns {object}
     */
    static calcUses(uses) {
        if (!uses) return null;
        return {
            ...uses,
            remaining: this.remainingUses,
            enabled: uses.hasOwnProperty('enabled') ? uses.enabled : true
        };
    }

    /**
     * Check if the Action still get atleast one unspent uses.
     * Must be called within Action context.
     * @param {*} uses 
     * @returns {boolean}
     */
    static hasUses(uses) {
        if (!uses) return true;
        let max = uses.max ?? 0;
        if (isNaN(max)) {
            const roll = new Roll(Roll.replaceFormulaData(uses.max, this.getRollData())).evaluateSync();
            max = roll.total;
        }
        return (uses.hasOwnProperty('enabled') && !uses.enabled) || uses.value + 1 <= max;
    }
}
