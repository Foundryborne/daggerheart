import DHBaseItemSheet from '../api/base-item.mjs';
import ItemAttachmentSheet from '../api/item-attachment-sheet.mjs';

export default class ArmorSheet extends ItemAttachmentSheet(DHBaseItemSheet) {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['armor'],
        tagifyConfigs: [
            {
                selector: '.features-input',
                options: () => CONFIG.DH.ITEM.orderedArmorFeatures(),
                callback: ArmorSheet.#onFeatureSelect
            }
        ]
    };

    /** @inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/armor/header.hbs' },
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
            template: 'systems/daggerheart/templates/sheets/items/armor/settings.hbs',
            scrollable: ['']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['']
        }
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

    async updateArmorEffect(event) {
        const value = Number.parseInt(event.target.value);
        const armorEffect = this.document.system.armorEffect;
        if (Number.isNaN(value) || !armorEffect) return;

        await armorEffect.system.armorChange.updateArmorMax(value);
        this.render();
    }

    /**
     * Callback function used by `tagifyElement`.
     * @param {Array<Object>} selectedOptions - The currently selected tag objects.
     */
    static async #onFeatureSelect(selectedOptions) {
        await this.document.update({ 'system.armorFeatures': selectedOptions.map(x => ({ value: x.value })) });
    }
}
