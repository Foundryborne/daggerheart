import DHBaseItemSheet from '../api/base-item.mjs';

export default class FeatureSheet extends DHBaseItemSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['feature']
    };

    /** @inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/feature/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { 
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs',
            scrollable: ['.description-section']
        },
        settings: { 
            template: 'systems/daggerheart/templates/sheets/items/feature/settings.hbs',
            scrollable: ['']
        },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'settings' }, { id: 'actions' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.featureFormChoices = CONFIG.DH.ITEM.featureForm;

        const evolutionLocked = this.document.system.actions.some(x => x.type === 'evolution');
        context.featureFormData = {
            value: this.document.system.featureForm,
            disabled: evolutionLocked,
            tooltip: evolutionLocked ? _loc('DAGGERHEART.ITEMS.Feature.evolutionLocked') : null
        };

        context.featureActorResources = CONFIG.DH.RESOURCE.optionalResources;
        
        return context;
    }
}
