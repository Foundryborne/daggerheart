import DHBaseItemSheet from '../api/base-item.mjs';

export default class WeaponSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['weapon'],
        tagifyConfigs: [
            {
                selector: '.features-input',
                options: () => CONFIG.DH.ITEM.weaponFeatures,
                callback: WeaponSheet.#onWeaponFeatureSelect
            }
        ]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/weapon/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-features.hbs',
            scrollable: ['.features']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/weapon/settings.hbs',
            scrollable: ['.settings']
        }
    };

    /**@inheritdoc */
    async _preparePartContext(partId, context) {
        super._preparePartContext(partId, context);

        switch (partId) {
            case 'settings':
                context.weaponFeatures = this.document.system.weaponFeatures.map(x => x.value);
                break;
        }

        return context;
    }

    /**
     * Callback function used by `tagifyElement`.
     * @param {Array<Object>} selectedOptions - The currently selected tag objects.
     */
    static async #onWeaponFeatureSelect(selectedOptions) {
        await this.document.update({ 'system.weaponFeatures': selectedOptions.map(x => ({ value: x.value })) });
    }
}
