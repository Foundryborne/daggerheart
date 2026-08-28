import { Resource } from '../../../data/settings/Homebrew.mjs';
import DHBaseItemSheet from '../api/base-item.mjs';

export default class FeatureSheet extends DHBaseItemSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['feature'],
        actions: {
            addActorResource: FeatureSheet.#onAddActorResource,
            removeActorResource: FeatureSheet.#onRemoveActorResource,
            resetActorResourceImage: FeatureSheet.#onResetActorResourceImage
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

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.path-field input'))
            element.addEventListener('change', this.#onToggleActorResourceIconType.bind(this));
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.featureFormChoices = CONFIG.DH.ITEM.featureForm;

        const evolutionLocked = this.document.system.actions.some(x => x.type === 'evolution');
        context.featureFormData = {
            value: this.document.system.featureForm,
            disabled: evolutionLocked,
            tooltip: evolutionLocked ? _loc('DAGGERHEART.ITEMS.Feature.evolutionLocked') : null
        };
        
        return context;
    }

    static async #onAddActorResource() {
        const content = new foundry.data.fields.StringField({
            label: game.i18n.localize('DAGGERHEART.GENERAL.name'),
            required: true
        }).toFormGroup({}, { name: 'name', localize: true }).outerHTML;

        async function callback(_, button) {
            const name = button.form.elements.name.value;
            if (!name) return;

            const sluggedName = name.slugify();
            await this.document.update({ [`system.actorResources.${sluggedName}`]: {  
                label: name
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

    async #onToggleActorResourceIconType(event) {
        const element = event.target.closest('.resource-icon-container');
        const { resourceKey, imageKey } = element.dataset;

        const current = this.document.system.actorResources[resourceKey].images[imageKey].isIcon;
        await this.document.update({ [`system.actorResources.${resourceKey}.images.${imageKey}`]: { 
            isIcon: !current,
            value: ''
        }});
    }

    static async #onResetActorResourceImage(_, button) {
        const element = button.closest('.resource-icon-container');
        const { resourceKey, imageKey } = element.dataset;

        await this.document.update({
            [`system.actorResources.${resourceKey}.images.${imageKey}`]:
                Resource.getDefaultImageData(imageKey)
        });

        this.render();
    }
}
