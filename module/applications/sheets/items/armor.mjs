import { armorFeatures } from '../../../config/itemConfig.mjs';
import { tagifyElement } from '../../../helpers/utils.mjs';
import DHItemSheetV2 from '../item.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class ArmorSheet extends DHItemSheetV2(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['armor'],
        dragDrop: [{ dragSelector: null, dropSelector: null }]
    };

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
        }
    };

    async _preparePartContext(partId, context) {
        super._preparePartContext(partId, context);

        switch (partId) {
            case 'settings':
                context.features = this.document.system.features.map(x => x.value);
                break;
        }

        return context;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        const featureInput = htmlElement.querySelector('.features-input');
        tagifyElement(featureInput, armorFeatures, this.onFeatureSelect.bind(this));
    }

    async onFeatureSelect(features) {
        await this.document.update({ 'system.features': features.map(x => ({ value: x.value })) });
        this.render(true);
    }
}
