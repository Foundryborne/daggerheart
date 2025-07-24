const fields = foundry.data.fields;

export default class UsesField extends fields.SchemaField {
    constructor(options = {}, context = {}) {
        const usesFields = {
            value: new fields.NumberField({ nullable: true, initial: null }),
            max: new fields.NumberField({ nullable: true, initial: null }),
            recovery: new fields.StringField({
                choices: CONFIG.DH.GENERAL.refreshTypes,
                initial: null,
                nullable: true
            })
        };
        super(usesFields, options, context);
    }

    static prepareConfig(config) {
        const uses = this.uses?.max ? foundry.utils.deepClone(this.uses) : null;
        if (uses && !uses.value) uses.value = 0;
        config.uses = uses;
        const hasUses = UsesField.hasUses.call(this, config.uses);
        if (config.isFastForward && !hasUses) return ui.notifications.warn("That action doesn't have remaining uses.");
        return hasUses;
    }

    static calcUses(uses) {
        if (!uses) return null;
        return {
            ...uses,
            enabled: uses.hasOwnProperty('enabled') ? uses.enabled : true
        };
    }

    static hasUses(uses) {
        if (!uses) return true;
        return (uses.hasOwnProperty('enabled') && !uses.enabled) || uses.value + 1 <= uses.max;
    }
}
