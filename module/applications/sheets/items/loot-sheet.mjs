import { mapValues } from '../../../helpers/functional.mjs';
import DHBaseItemSheet from '../api/base-item.mjs';

/** @import { DHLoot } from '../../../data/item/_module.mjs'; */

/** @extends {DHBaseItemSheet<DhItem<DHLoot>>} */
export default class LootSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['loot'],
        position: { width: 550 }
    };

    /** @inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/loot/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { 
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs',
            scrollable: ['.description-section']
        },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/loot/settings.hbs',
            scrollable: ['']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['']
        }
    };

    async _prepareContext(options) {
        const item = this.item;
        const itemSubCategories = CONFIG.DH.ITEM.itemSubCategories;
        
        const context = await super._prepareContext(options);
        context.categoryLabel = _loc(itemSubCategories[item.system.category]?.label ?? `TYPES.Item.loot`);
        context.choices = mapValues(itemSubCategories, c => c.label);

        const categoryField = itemSubCategories[item.system.category]?.data;
        if (categoryField) {
            context.categoryDataLabel = _loc(categoryField.label) ?? context.categoryLabel; 
            context.categoryData = mapValues(categoryField.fields, (field, k) => ({
                field,
                name: `system.categoryData.${k}`,
                value: this.item._source.system.categoryData?.[k]
            }));
        }

        return context;
    }
}
