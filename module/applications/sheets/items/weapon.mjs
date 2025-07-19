import DHBaseItemSheet from '../api/base-item.mjs';
import ItemAttachmentSheet from '../api/item-attachment-sheet.mjs';

export default class WeaponSheet extends ItemAttachmentSheet(DHBaseItemSheet) {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['weapon'],
        tagifyConfigs: [
            {
                selector: '.features-input',
                options: () => CONFIG.DH.ITEM.weaponFeatures,
                callback: WeaponSheet.#onFeatureSelect
            }
        ]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/weapon/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/weapon/settings.hbs',
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
                context.features = this.document.system.weaponFeatures.map(x => x.value);
                context.systemFields.attack.fields = this.document.system.attack.schema.fields;
                break;
        }
        return context;
    }

    /**
     * Callback function used by `tagifyElement`.
     * @param {Array<Object>} selectedOptions - The currently selected tag objects.
     */
    static async #onFeatureSelect(selectedOptions) {
        await this.document.update({ 'system.weaponFeatures': selectedOptions.map(x => ({ value: x.value })) });
    }
}
