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

    // /** @inheritDoc */
    // _initializeSource(data, options={}) {
    //     const { originItemType, isMulticlass } = data;
    //     const base = (originItemType && this.parent?.parent?.type === 'character') ? this.parent.parent.items._source.find(x => x.type === originItemType && Boolean(isMulticlass) === x.system.isMulticlass) : null;
    //     if(base) {
    //         const feature = base.system.features.find(x => x.item && x.item === this.parent.uuid);
    //         if(feature && data.identifier !== 'multiclass') {
    //             data.identifier = feature.type;
    //         }
    //     }

    //     return super._initializeSource(data, options);
    // }

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
            identifier: new fields.StringField()
        };
    }
}
