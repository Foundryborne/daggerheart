import AttachableItem from './attachableItem.mjs';
import { ActionsField } from '../fields/actionField.mjs';
import { armorFeatures } from '../../config/itemConfig.mjs';

export default class DHArmor extends AttachableItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.armor',
            type: 'armor',
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
            tier: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1 }),
            equipped: new fields.BooleanField({ initial: false }),
            baseScore: new fields.NumberField({ integer: true, initial: 0 }),
            armorFeatures: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.StringField({
                        required: true,
                        choices: CONFIG.DH.ITEM.armorFeatures,
                        blank: true
                    }),
                    effectIds: new fields.ArrayField(new fields.StringField({ required: true })),
                    actionIds: new fields.ArrayField(new fields.StringField({ required: true }))
                })
            ),
            marks: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true })
            }),
            baseThresholds: new fields.SchemaField({
                major: new fields.NumberField({ integer: true, initial: 0 }),
                severe: new fields.NumberField({ integer: true, initial: 0 })
            })
        };
    }

    get customActions() {
        return this.actions.filter(
            action => !this.armorFeatures.some(feature => feature.actionIds.includes(action.id))
        );
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system.armorFeatures) {
            const removed = this.armorFeatures.filter(x => !changes.system.armorFeatures.includes(x));
            const added = changes.system.armorFeatures.filter(x => !this.armorFeatures.includes(x));

            const effectIds = [];
            const actionIds = [];
            for (var feature of removed) {
                effectIds.push(...feature.effectIds);
                actionIds.push(...feature.actionIds);
            }
            await this.parent.deleteEmbeddedDocuments('ActiveEffect', effectIds);
            changes.system.actions = actionIds.reduce((acc, id) => {
                acc[`-=${id}`] = null;
                return acc;
            }, {});

            for (var feature of added) {
                const featureData = armorFeatures[feature.value];
                if (featureData.effects?.length > 0) {
                    const embeddedItems = await this.parent.createEmbeddedDocuments('ActiveEffect', [
                        {
                            name: game.i18n.localize(featureData.label),
                            description: game.i18n.localize(featureData.description),
                            changes: featureData.effects.flatMap(x => x.changes)
                        }
                    ]);
                    feature.effectIds = embeddedItems.map(x => x.id);
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
                feature.actionIds = Object.keys(newActions);
            }
        }
    }
}
