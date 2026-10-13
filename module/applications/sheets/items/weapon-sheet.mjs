import { mapValues } from '../../../helpers/functional.mjs';
import DHBaseItemSheet from '../api/base-item.mjs';
import ItemAttachmentSheet from '../api/item-attachment-sheet.mjs';

/** @import { DHWeapon } from '../../../data/item/_module.mjs'; */

/** @extends {DHBaseItemSheet<DhItem<DHWeapon>>} */
export default class WeaponSheet extends ItemAttachmentSheet(DHBaseItemSheet) {
    /** @inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['weapon'],
        actions: {
            configureAttack: WeaponSheet.#configureAttack
        },
        position: {
            height: 500
        },
        tagifyConfigs: [
            {
                selector: '.features-input',
                options: async () => {
                    const options = CONFIG.DH.ITEM.orderedWeaponFeatures();
                    const TextEditor = foundry.applications.ux.TextEditor;
                    for (const option of options) {
                        // Descriptions may use Lookup's with fallback values, which we want to show
                        option.description = await TextEditor.enrichHTML(_loc(option.description));
                    }
                    return options;
                },
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

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.source = this.document._source;

        return context;
    }

    /** @inheritdoc */
    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);
        switch (partId) {
            case 'settings': {
                const weaponFeatures = CONFIG.DH.ITEM.allWeaponFeatures();
                const featureIds = Object.keys(this.item._source.system.itemFeatures);
                context.features = featureIds;
                context.systemFields.attack.fields = this.document.system.attack.schema.fields;
                context.featureErrors = featureIds.reduce((acc, curr) => {
                    const configData = weaponFeatures[curr];
                    const error = configData?.getErrorText?.(this.document);
                    if (error) return !acc ? error : [acc, error].join(', ');

                    return acc;
                }, null);

                context.featureConfigs = context.features
                    .map(featureKey => {
                        const feature = weaponFeatures[featureKey];
                        if (!feature.config) return null;

                        return {
                            label: _loc(feature.label),
                            data: mapValues(feature.config.fields, (field, k) => ({
                                field,
                                name: `system.itemFeatures.${featureKey}.config.${k}`,
                                value: this.item._source.system.itemFeatures[featureKey]?.config[k]
                            }))
                        };
                    })
                    .filter(Boolean);

                break;
            }
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
<<<<<<< HEAD
        await this.document.update({ 
            'system.weaponFeatures': selectedOptions.map(x => ({
                ...(this.document._source.weaponFeatures?.find(f => f.value === x.value) ?? {}),
                value: x.value
            }))
=======
        const document = this.document;
        const selectedFeatures = selectedOptions.map(x => x.value);
        const toRemove = Object.keys(document.system.itemFeatures).filter(f => !selectedFeatures.includes(f));
        const toAdd = selectedFeatures.filter(f => !(f in document.system.itemFeatures)); 
        await document.update({ 
            'system.itemFeatures': {
                ...Object.fromEntries(toAdd.map(f => [f, { value: f }])),
                ...Object.fromEntries(toRemove.map(f => [f, _del]))
            }
>>>>>>> c8452c0fe (Refactor item features into an object, and move config to there)
        });
    }
}
