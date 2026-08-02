import BaseDataItem from './base.mjs';

export default class DHFeature extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.feature',
            type: 'feature',
            hasDescription: true,
            hasResource: true,
            hasActions: true
        });
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/stars-stack.svg';

    /* -------------------------------------------- */

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            originItemType: new fields.StringField({
                choices: CONFIG.DH.ITEM.featureTypes,
                nullable: true,
                initial: null
            }),
            multiclassOrigin: new fields.BooleanField({ initial: false }),
            identifier: new fields.StringField(),
            featureForm: new fields.StringField({
                required: true,
                initial: 'passive',
                choices: CONFIG.DH.ITEM.featureForm,
                label: 'DAGGERHEART.CONFIG.FeatureForm.label'
            }),
            evolutionRequirement: new fields.SchemaField({
                requirement: new fields.NumberField({ integer: true, min: 0, initial: 1 })
                // comparator: new fields.StringField({ choices: ... })  gte, gt, lt, lte, eq
            }, { nullable: true, initial: null })
        };
    }
}
