export default class EphemeralChange extends foundry.abstract.DataModel {
    #single = false;

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            key: new fields.StringField({required: true}),
            baseType: new fields.StringField({
                required: true, 
                blank: false, 
                initial: 'add',
                validate: EphemeralChange.#validateType
            }),
            type: new fields.StringField({ required: true, blank: false, choices: ['ephemeral'], initial: 'ephemeral' }),
            value: new fields.AnyField({required: true, nullable: true, serializable: true, initial: ''}),
            priority: new fields.NumberField({
                label: 'EFFECT.FIELDS.changes.element.priority.label',
                required: true, 
                integer: true, 
                initial: 20
            }),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' })
        };
    }

    static #validateType(type) {
        if (type.length < 3) throw new Error('must be at least three characters long');
        if (!/^custom\.-?\d+$/.test(type) && !type.split('.').every(s => /^[a-z0-9]+$/i.test(s))) {
            throw new Error(
                'A change type must either be a sequence of dot-delimited, alpha-numeric substrings or of the form' +
                    ' "custom.{number}"'
            );
        }
        return true;
    }

    get single() {
        return this.#single;
    }

    static getInitialValue() {
        return {
            key: '',
            baseType: 'add',
            type: CONFIG.DH.EFFECTS.customChangeTypes.ephemeral.id,
            value: '',
            phase: 'initial',
            priority: 20
        };
    }

    static changeEffect = {
        ...super.changeEffect,
        label: 'Ephemeral',
        defaultPriority: 0,
        handler: (doc, change, _options, _field, _replacementData) => {
            if (!doc.ephemeralEffects) return;
            
            doc.ephemeralEffects.add(change);
        },
        render: null
    }
}