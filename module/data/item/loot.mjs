import BaseDataItem from './base.mjs';

export default class DHLoot extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.loot',
            type: 'loot',
            hasDescription: true,
            isQuantifiable: true,
            isInventoryItem: true,
            hasActions: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        return {
            ...super.defineSchema()
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/open-treasure-chest.svg';

    /* -------------------------------------------- */
}
