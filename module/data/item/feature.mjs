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
            granter: new fields.SchemaField({
                id: new fields.StringField(),
                type: new fields.StringField({
                    choices: CONFIG.DH.ITEM.featureTypes,
                    nullable: true,
                    initial: null
                }),
                multiclass: new fields.BooleanField({ initial: false }),
                identifier: new fields.StringField()
            }, { nullable: true, initial: null }),
            featureForm: new fields.StringField({
                required: true,
                initial: 'passive',
                choices: CONFIG.DH.ITEM.featureForm,
                label: 'DAGGERHEART.CONFIG.FeatureForm.label'
            })
        };
    }

    _preCreate(data, options, user) {
        // Ensure granter is purged if this is being created as a world item
        // Otherwise, check if valid. If keepId is on, it may be a batch creation, so we presume its with intent
        if (data.system?.granter) {
            const canHaveGranter = this.actor && (options.keepId || this.actor.items.has(data.system.granter.id));
            if (!canHaveGranter) this.updateSource({ granter: null });
        }
        return super._preCreate(data, options, user);
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        this.granterItem = this.actor?.items.get(this.granter?.id);
    }
}
