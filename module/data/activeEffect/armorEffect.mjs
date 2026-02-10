import { getScrollTextData } from '../../helpers/utils.mjs';

/**
 * ArmorEffects are ActiveEffects that have a static changes field of length 1. It includes current and maximum armor.
 * When applied to a character, it adds to their currently marked and maximum armor.
 */
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
                    value: new fields.NumberField({
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
                }),
                {
                    initial: [
                        {
                            type: CONFIG.DH.GENERAL.activeEffectModes.armor.id,
                            phase: 'initial',
                            priority: 20,
                            value: 0,
                            max: 1
                        }
                    ]
                }
            )
        };
    }

    /* Type Functions */

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

    /* Helpers */

    get armorChange() {
        if (this.changes.length !== 1)
            throw new Error('Unexpected error. An armor effect should have a changes field of length 1.');
        return this.changes[0];
    }

    get armorData() {
        return { value: this.armorChange.value, max: this.armorChange.max };
    }

    async updateArmorMax(newMax) {
        const newChanges = [
            {
                ...this.armorChange,
                max: newMax,
                value: Math.min(this.armorChange.value, newMax)
            }
        ];
        await this.parent.update({ 'system.changes': newChanges });
    }

    static orderEffectsForAutoChange(armorEffects, increasing) {
        const getEffectWeight = effect => {
            switch (effect.parent.type) {
                case 'loot':
                case 'consumable':
                    return 2;
                case 'class':
                case 'subclass':
                case 'ancestry':
                case 'community':
                case 'feature':
                case 'domainCard':
                    return 3;
                case 'weapon':
                case 'armor':
                    return 4;
                case 'character':
                    return 5;
                default:
                    return 1;
            }
        };

        return armorEffects.sort((a, b) =>
            increasing ? getEffectWeight(b) - getEffectWeight(a) : getEffectWeight(a) - getEffectWeight(b)
        );
    }

    /* Overrides */

    prepareBaseData() {
        const armorChange = this.armorChange;
        armorChange.key = 'system.armorScore';
    }

    static getDefaultEffectData() {
        return {
            type: 'armor',
            name: game.i18n.localize('DAGGERHEART.EFFECTS.Armor.newArmorEffect'),
            img: 'icons/equipment/chest/breastplate-helmet-metal.webp'
        };
    }

    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        await this.updateSource({ ...ArmorEffect.getDefaultEffectData(), data });
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system?.changes) {
            const changesChanged = changes.system.changes.length !== this.changes.length;
            if (changesChanged) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.UI.Notifications.cannotAlterArmorEffectChanges')
                );
                return false;
            }

            if (
                changes.system.changes.length === 1 &&
                changes.system.changes[0].type !== CONFIG.DH.GENERAL.activeEffectModes.armor.id
            ) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.cannotAlterArmorEffectType'));
                return false;
            }

            if (changes.system.changes[0].value !== this.armorChange.value && this.parent.actor?.type === 'character') {
                const increased = changes.system.changes[0].value > this.armorChange.value;
                const value = -1 * (this.armorChange.value - changes.system.changes[0].value);
                options.scrollingTextData = [getScrollTextData(increased, value, 'armor')];
            }
        }
    }

    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        if (options.scrollingTextData && this.parent.actor?.type === 'character')
            this.parent.actor.queueScrollText(options.scrollingTextData);
    }
}
