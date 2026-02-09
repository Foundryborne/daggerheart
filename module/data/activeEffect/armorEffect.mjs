export default class ArmorEffect extends foundry.data.ActiveEffectTypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            changes: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({
                        required: true,
                        blank: false,
                        choices: CONFIG.DH.GENERAL.activeEffectModes,
                        initial: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                        validate: ArmorEffect.#validateType
                    }),
                    phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
                    priority: new fields.NumberField(),
                    marked: new fields.NumberField({
                        required: true,
                        integer: true,
                        initial: 0,
                        min: 0,
                        label: 'DAGGERHEART.GENERAL.value'
                    }),
                    max: new fields.NumberField({
                        required: true,
                        integer: true,
                        initial: 1,
                        min: 1,
                        label: 'DAGGERHEART.GENERAL.max'
                    })
                })
            )
        };
    }

    static applyChangeField(model, change, field) {
        return [model, change, field];
    }

    prepareBaseData() {
        for (const change of this.changes) {
            change.key = 'system.armorScore.value';
            change.value = Math.min(change.max - change.marked, change.max);
        }
    }

    /**
     * Validate that an {@link EffectChangeData#type} string is well-formed.
     * @param {string} type The string to be validated
     * @returns {true}
     * @throws {Error} An error if the type string is malformed
     */
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
}
