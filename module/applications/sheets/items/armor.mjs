import DHBaseItemSheet from '../api/base-item.mjs';
import ItemAttachmentSheet from '../api/item-attachment-sheet.mjs';

export default class ArmorSheet extends ItemAttachmentSheet(DHBaseItemSheet) {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['armor'],
        tagifyConfigs: [
            {
                selector: '.features-input',
                options: () => CONFIG.DH.ITEM.armorFeatures,
                callback: ArmorSheet.#onFeatureSelect
            }
        ]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/armor/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/armor/settings.hbs',
            scrollable: ['.settings']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        },
        ...super.PARTS,
    };

    /**@inheritdoc */
    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);

        switch (partId) {
            case 'settings':
                context.features = this.document.system.armorFeatures.map(x => x.value);
                break;
        }

        return context;
    }

    /**
     * Callback function used by `tagifyElement`.
     * @param {Array<Object>} selectedOptions - The currently selected tag objects.
     */
    static async #onFeatureSelect(selectedOptions) {
        await this.document.update({ 'system.armorFeatures': selectedOptions.map(x => ({ value: x.value })) });
    }
}
