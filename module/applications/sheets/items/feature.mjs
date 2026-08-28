import DHBaseItemSheet from '../api/base-item.mjs';

export default class FeatureSheet extends DHBaseItemSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['feature'],
        actions: {
            addActorResource: FeatureSheet.#onAddActorResource,
            removeActorResource: FeatureSheet.#onRemoveActorResource
        }
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

        context.featureActorResources = Object.entries(this.document.system.actorResources)
            .reduce((acc, [key, data]) => {
                const resource = CONFIG.DH.RESOURCE.optionalResources[key];
                if (!resource) return acc; // Might need to handle this better incase the global resource has been removed, so we can delete the feature part?
                acc[key] = {
                    ...resource,
                    ...data
                }
                return acc;
            }, {});
        
        return context;
    }

    static async #onAddActorResource() {
        const choices = Object.entries(CONFIG.DH.RESOURCE.optionalResources).reduce((acc, [key, data]) => {
            if (!this.document.system.actorResources[key])
                acc[key] = data;

            return acc;
        }, {});
        const content = new foundry.data.fields.StringField({
            choices: choices,
            blank: true,
            required: true
        }).toFormGroup({}, { name: 'name', localize: true }).outerHTML;

        async function callback(_, button) {
            const name = button.form.elements.name.value;
            const resource = choices[name];
            if (!resource) return;

            await this.document.update({ [`system.actorResources.${resource.id}`]: {  
                value: resource.initial
            }})
        }

        await foundry.applications.api.DialogV2.prompt({
            content: content,
            rejectClose: false,
            modal: true,
            ok: { callback: callback.bind(this) },
            window: {
                title: game.i18n.localize('DAGGERHEART.ITEMS.Feature.createActorResourceTitle')
            },
            position: { width: 400 }
        });
    }
    
    static async #onRemoveActorResource(_, button) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize(`DAGGERHEART.ITEMS.Feature.deleteActorResourceTitle`)
            },
            content: game.i18n.localize('DAGGERHEART.ITEMS.Feature.deleteActorResourceText')
        });

        if (!confirmed) return;

        this.document.update({ [`system.actorResources.${button.dataset.resourceKey}`]: _del})
    }
}
