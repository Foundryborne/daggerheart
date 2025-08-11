import AttachableItem from './attachableItem.mjs';
import { ActionsField, ActionField } from '../fields/actionField.mjs';

export default class DHWeapon extends AttachableItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.weapon',
            type: 'weapon',
            hasDescription: true,
            isInventoryItem: true,
            hasActions: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1, label: "DAGGERHEART.GENERAL.Tiers.singular" }),
            equipped: new fields.BooleanField({ initial: false }),

            //SETTINGS
            secondary: new fields.BooleanField({ initial: false, label: "DAGGERHEART.ITEMS.Weapon.secondaryWeapon" }),
            burden: new fields.StringField({ required: true, choices: CONFIG.DH.GENERAL.burden, initial: 'oneHanded', label: "DAGGERHEART.GENERAL.burden" }),
            weaponFeatures: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.StringField({
                        required: true,
                        choices: CONFIG.DH.ITEM.weaponFeatures,
                        blank: true
                    }),
                    effectIds: new fields.ArrayField(new fields.StringField({ required: true })),
                    actionIds: new fields.ArrayField(new fields.StringField({ required: true }))
                })
            ),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    img: 'icons/skills/melee/blood-slash-foam-red.webp',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
                    type: 'attack',
                    range: 'melee',
                    target: {
                        type: 'any',
                        amount: 1
                    },
                    roll: {
                        trait: 'agility',
                        type: 'attack'
                    },
                    damage: {
                        parts: [
                            {
                                type: ['physical'],
                                value: {
                                    multiplier: 'prof',
                                    dice: 'd8'
                                }
                            }
                        ]
                    }
                }
            }),
            rules: new fields.SchemaField({
                attack: new fields.SchemaField({
                    roll: new fields.SchemaField({
                        trait: new fields.StringField({
                            required: true,
                            choices: CONFIG.DH.ACTOR.abilities,
                            nullable: true,
                            initial: null,
                            label: 'DAGGERHEART.GENERAL.Rules.attack.roll.trait.label'
                        })
                    })
                })
            })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/battered-axe.svg';

    /* -------------------------------------------- */

    get actionsList() {
        return [this.attack, ...this.actions];
    }

    get customActions() {
        return this.actions.filter(
            action => !this.weaponFeatures.some(feature => feature.actionIds.includes(action.id))
        );
    }

    prepareDerivedData() {
        this.attack.roll.trait = this.rules.attack.roll.trait ?? this.attack.roll.trait;
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system?.weaponFeatures) {
            const removed = this.weaponFeatures.filter(x => !changes.system.weaponFeatures.includes(x));
            const added = changes.system.weaponFeatures.filter(x => !this.weaponFeatures.includes(x));

            const removedEffectsUpdate = [];
            const removedActionsUpdate = [];
            for (let weaponFeature of removed) {
                removedEffectsUpdate.push(...weaponFeature.effectIds);
                removedActionsUpdate.push(...weaponFeature.actionIds);
            }

            await this.parent.deleteEmbeddedDocuments('ActiveEffect', removedEffectsUpdate);
            changes.system.actions = removedActionsUpdate.reduce((acc, id) => {
                acc[`-=${id}`] = null;
                return acc;
            }, {});

            for (let weaponFeature of added) {
                const featureData = CONFIG.DH.ITEM.weaponFeatures[weaponFeature.value];
                if (featureData.effects?.length > 0) {
                    const embeddedItems = await this.parent.createEmbeddedDocuments(
                        'ActiveEffect',
                        featureData.effects.map(effect => ({
                            ...effect,
                            name: game.i18n.localize(effect.name),
                            description: game.i18n.localize(effect.description)
                        }))
                    );
                    weaponFeature.effectIds = embeddedItems.map(x => x.id);
                }

                const newActions = {};
                if (featureData.actions?.length > 0) {
                    for (let action of featureData.actions) {
                        const embeddedEffects = await this.parent.createEmbeddedDocuments(
                            'ActiveEffect',
                            (action.effects ?? []).map(effect => ({
                                ...effect,
                                transfer: false,
                                name: game.i18n.localize(effect.name),
                                description: game.i18n.localize(effect.description)
                            }))
                        );
                        weaponFeature.effectIds = [
                            ...(weaponFeature.effectIds ?? []),
                            ...embeddedEffects.map(x => x.id)
                        ];

                        const cls = game.system.api.models.actions.actionsTypes[action.type];
                        const actionId = foundry.utils.randomID();
                        newActions[actionId] = new cls(
                            {
                                ...cls.getSourceConfig(this),
                                ...action,
                                _id: actionId,
                                name: game.i18n.localize(action.name),
                                description: game.i18n.localize(action.description),
                                effects: embeddedEffects.map(x => ({ _id: x.id }))
                            },
                            { parent: this }
                        );
                    }
                }

                changes.system.actions = newActions;
                weaponFeature.actionIds = Object.keys(newActions);
            }
        }
    }

    /**
     * Generates a list of localized tags based on this item's type-specific properties.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const { attack, burden } = this;
        const tags = [
            game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${attack.roll.trait}.name`),
            game.i18n.localize(`DAGGERHEART.CONFIG.Range.${attack.range}.name`),
            game.i18n.localize(`DAGGERHEART.CONFIG.Burden.${burden}`)
        ];

        for (const { value, type } of attack.damage.parts) {
            const parts = [value.dice];
            if (value.bonus) parts.push(value.bonus.signedString());

            if (type.size > 0) {
                const typeTags = Array.from(type)
                    .map(t => game.i18n.localize(`DAGGERHEART.CONFIG.DamageType.${t}.abbreviation`))
                    .join(' | ');
                parts.push(` (${typeTags})`); // Add a space in front and put it inside a ().
            }

            tags.push(parts.join(''));
        }

        return tags;
    }

    /**
     * Generate a localized label array for this item subtype.
     * @returns {(string | { value: string, icons: string[] })[]} An array of localized strings and damage label objects.
     */
    _getLabels() {
        const labels = [];
        const { roll, range, damage } = this.attack;

        if (roll.trait) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${roll.trait}.short`))
        if (range) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.Range.${range}.short`));

        for (const { value, type } of damage.parts) {
            const str = Roll.replaceFormulaData(value.getFormula(), this.actor?.getRollData() ?? {});

            const icons = Array.from(type)
                .map(t => CONFIG.DH.GENERAL.damageTypes[t]?.icon)
                .filter(Boolean);

            if (icons.length === 0) {
                labels.push(str);
            } else {
                labels.push({ value: str, icons });
            }
        }

        return labels;
    }

    get itemFeatures() {
        return this.weaponFeatures;
    }
}
