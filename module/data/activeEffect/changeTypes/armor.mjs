import { itemAbleRollParse } from '../../../helpers/utils.mjs';

const fields = foundry.data.fields;

export default class ArmorChange extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            type: new fields.StringField({ required: true, choices: ['armor'], initial: 'armor' }),
            priority: new fields.NumberField(),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
            value: new fields.SchemaField({
                current: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
                max: new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: '1',
                    label: 'DAGGERHEART.GENERAL.max'
                }),
                interaction: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.activeEffectArmorInteraction,
                    initial: CONFIG.DH.GENERAL.activeEffectArmorInteraction.none.id,
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.armor.FIELDS.interaction.label',
                    hint: 'DAGGERHEART.EFFECTS.ChangeTypes.armor.FIELDS.interaction.hint'
                })
            })
        };
    }

    static changeEffect = {
        label: 'Armor',
        defaultPriority: 20,
        handler: (actor, change, _options, _field, replacementData) => {
            const parsedMax = itemAbleRollParse(change.value.max, actor, change.effect.parent);
            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    key: 'system.armorScore.value',
                    type: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                    value: change.value.current
                },
                replacementData
            );
            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    key: 'system.armorScore.max',
                    type: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                    value: parsedMax
                },
                replacementData
            );
            return {};
        },
        render: null
    };

    get isSuppressed() {
        switch (this.value.interaction) {
            case CONFIG.DH.GENERAL.activeEffectArmorInteraction.active.id:
                return !this.parent.parent?.actor.system.armor;
            case CONFIG.DH.GENERAL.activeEffectArmorInteraction.inactive.id:
                return Boolean(this.parent.parent?.actor.system.armor);
            default:
                return false;
        }
    }

    static getInitialValue() {
        return {
            type: CONFIG.DH.GENERAL.activeEffectModes.armor.id,
            value: {
                current: 0,
                max: 0
            },
            phase: 'initial',
            priority: 20
        };
    }

    static getDefaultArmorEffect() {
        return {
            name: game.i18n.localize('DAGGERHEART.EFFECTS.ChangeTypes.armor.newArmorEffect'),
            img: 'icons/equipment/chest/breastplate-helmet-metal.webp',
            system: {
                changes: [ArmorChange.getInitialValue()]
            }
        };
    }

    /* Helpers */

    getArmorData() {
        const actor = this.parent.parent?.actor?.type === 'character' ? this.parent.parent.actor : null;
        const maxParse = actor ? itemAbleRollParse(this.value.max, actor, this.parent.parent.parent) : null;
        const maxRoll = maxParse ? new Roll(maxParse).evaluateSync() : null;
        const maxEvaluated = maxRoll ? (maxRoll.isDeterministic ? maxRoll.total : null) : null;

        return {
            current: this.value.current,
            max: maxEvaluated ?? this.value.max
        };
    }

    async updateArmorMax(newMax) {
        const newChanges = [
            ...this.parent.changes.map(change => ({
                ...change,
                value:
                    change.type === 'armor'
                        ? {
                              ...change.value,
                              current: Math.min(change.value.current, newMax),
                              max: newMax
                          }
                        : change.value
            }))
        ];
        await this.parent.parent.update({ 'system.changes': newChanges });
    }

    static orderEffectsForAutoChange(armorEffects, increasing) {
        const getEffectWeight = effect => {
            switch (effect.parent.type) {
                case 'class':
                case 'subclass':
                case 'ancestry':
                case 'community':
                case 'feature':
                case 'domainCard':
                    return 2;
                case 'armor':
                    return 3;
                case 'loot':
                case 'consumable':
                    return 4;
                case 'weapon':
                    return 5;
                case 'character':
                    return 6;
                default:
                    return 1;
            }
        };

        return armorEffects
            .filter(x => !x.disabled && !x.isSuppressed)
            .sort((a, b) =>
                increasing ? getEffectWeight(b) - getEffectWeight(a) : getEffectWeight(a) - getEffectWeight(b)
            );
    }
}
