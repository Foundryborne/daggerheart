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
                        initial: CONFIG.DH.GENERAL.activeEffectModes.armor.id,
                        validate: ArmorEffect.#validateType
                    }),
                    phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
                    priority: new fields.NumberField({ integer: true, initial: 20 }),
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

    get armorData() {
        if (this.changes.length !== 1) return { value: 0, max: 0 };
        return { value: this.changes[0].value, max: this.changes[0].max };
    }

    async updateArmorMax(newMax) {
        if (this.changes.length !== 1) return;
        const newChanges = this.changes.map(change => ({
            ...change,
            max: newMax,
            marked: Math.min(change.marked, newMax)
        }));
        await this.parent.update({ 'system.changes': newChanges });
    }

    static applyChangeField(model, change, field) {
        return [model, change, field];
    }

    static armorChangeEffect = {
        label: 'Armor',
        defaultPriortiy: 20,
        handler: (actor, change, _options, _field, replacementData) => {
            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    key: 'system.armorScore.value',
                    type: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                    value: change.value
                },
                replacementData
            );
            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    key: 'system.armorScore.max',
                    type: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                    value: change.max
                },
                replacementData
            );
            return {};
        },
        render: null
    };

    prepareBaseData() {
        for (const change of this.changes) {
            change.key = 'system.armorScore';
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
        if (type !== CONFIG.DH.GENERAL.activeEffectModes.armor.id)
            throw new Error('An armor effect must have change.type "armor"');

        return true;
    }
}
