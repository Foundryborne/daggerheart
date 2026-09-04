import DHBaseItemSheet from '../api/base-item.mjs';
import ItemAttachmentSheet from '../api/item-attachment-sheet.mjs';

export default class WeaponSheet extends ItemAttachmentSheet(DHBaseItemSheet) {
    /** @inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['weapon'],
        actions: {
            configureAttack: WeaponSheet.#configureAttack
        },
        tagifyConfigs: [
            {
                selector: '.features-input',
                options: () => CONFIG.DH.ITEM.orderedWeaponFeatures(),
                callback: WeaponSheet.#onFeatureSelect
            }
        ]
    };

    /** @inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/weapon/header.hbs' },
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
            template: 'systems/daggerheart/templates/sheets/items/weapon/settings.hbs',
            scrollable: ['']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['']
        }
    };

    /** @inheritdoc */
    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);
        switch (partId) {
            case 'settings':
                context.features = this.document.system.weaponFeatures.map(x => x.value);
                context.systemFields.attack.fields = this.document.system.attack.schema.fields;
                context.featureErrors = this.document.system.weaponFeatures.reduce((acc, curr) => {
                    const configData = CONFIG.DH.ITEM.weaponFeatures[curr.value];
                    const error = configData?.getErrorText?.(this.document);
                    if (error) return !acc ? error : [acc, error].join(', ');

                    return acc;
                }, null);

                break;
        }
        return context;
    }

    /**
     * Open the action configuration sheet for the weapon's base attack.
     */
    static #configureAttack() {
        this.document.system.attack.sheet.render({ force: true });
    }

    /**
     * Callback function used by `tagifyElement`.
     * @param {Array<Object>} selectedOptions - The currently selected tag objects.
     */
    static async #onFeatureSelect(selectedOptions) {
        await this.document.update({ 'system.weaponFeatures': selectedOptions.map(x => ({ value: x.value })) });
    }
}
