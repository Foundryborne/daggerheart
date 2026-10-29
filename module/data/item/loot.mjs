import BaseDataItem from './base.mjs';

export default class DHLoot extends BaseDataItem {
    static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, 'DAGGERHEART.ITEMS.Item'];
    
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.loot',
            type: 'loot',
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
            // category is defined as module data, and allows a module to add sub item types that are treated as regular loot when disabled
            category: new fields.StringField({ nullable: true, blank: false, initial: null }),
            categoryData: new fields.ObjectField({ nullable: false, initial: {} })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/open-treasure-chest.svg';

    /* -------------------------------------------- */

    get hasDescription() {
        return super.hasDescription 
            || CONFIG.DH.ITEM.itemSubCategories[this.category]?.hasDescription?.(this.parent, this.categoryData);
    }

    _initialize(options) {
        super._initialize(options);

        const categoryDataField = CONFIG.DH.ITEM.itemSubCategories[this.category]?.data;
        if (categoryDataField) {
            try {
                this.categoryData = categoryDataField.initialize(
                    this.categoryData ?? categoryDataField.getInitialValue()
                );
            } catch (ex) {
                console.error(ex);
                this.categoryData = categoryDataField.initialize(categoryDataField.getInitialValue()) ?? {};
            }
        }
    }

    static _cleanData(data, options, _state) {
        const hadNoConfig = !data?.categoryData;
        data = super._cleanData(data, options, _state);

        const categoryDataField = CONFIG.DH.ITEM.itemSubCategories[this.category]?.data;
        if (data && categoryDataField) {
            const innerState = { ..._state, source: data.categoryData };
            if (hadNoConfig && foundry.utils.isEmpty(data.categoryData)) {
                data.categoryData = categoryDataField.getInitialValue();
            }
            data.categoryData = categoryDataField.clean(data.categoryData, options, innerState);
        }

        return data;
    }

    /** @inheritdoc */
    async getDescriptionData(options, config) {
        const data = await super.getDescriptionData(options, config);
        const categoryData = CONFIG.DH.ITEM.itemSubCategories[this.category];
        try {
            await categoryData?.updateDescriptionData?.(this.parent, data, options, config);
        } catch (ex) {
            console.error(ex);
        }
        return data;
    }

    async _preUpdate(changed, options, userId) {
        const allowed = await super._preUpdate(changed, options, userId);
        if (allowed === false) return false;

        if (changed.system?.category && changed.system.category !== this.category) {
            const categoryDataField = CONFIG.DH.ITEM.itemSubCategories[changed.system.category]?.data;
            changed.system.categoryData = _replace(
                categoryDataField?.clean(changed.system.categoryData ?? categoryDataField?.getInitialValue()) ?? {}
            );
        }
    }
}
