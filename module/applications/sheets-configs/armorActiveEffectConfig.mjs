const { HandlebarsApplicationMixin, DocumentSheetV2 } = foundry.applications.api;

export default class ArmorActiveEffectConfig extends HandlebarsApplicationMixin(DocumentSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'dh-style', 'active-effect-config', 'armor-effect-config'],
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            finish: ArmorActiveEffectConfig.#finish
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/activeEffect/header.hbs' },
        tabs: { template: 'templates/generic/tab-navigation.hbs' },
        details: { template: 'systems/daggerheart/templates/sheets/activeEffect/armor/details.hbs' },
        settings: { template: 'systems/daggerheart/templates/sheets/activeEffect/armor/settings.hbs' },
        footer: { template: 'systems/daggerheart/templates/sheets/activeEffect/armor/footer.hbs' }
    };

    static TABS = {
        sheet: {
            tabs: [
                { id: 'details', icon: 'fa-solid fa-book' },
                { id: 'settings', icon: 'fa-solid fa-bars', label: 'DAGGERHEART.GENERAL.Tabs.settings' }
            ],
            initial: 'details',
            labelPrefix: 'EFFECT.TABS'
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.systemFields = context.document.system.schema.fields;

        return context;
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context) {
        const partContext = await super._preparePartContext(partId, context);
        if (partId in partContext.tabs) partContext.tab = partContext.tabs[partId];

        return partContext;
    }

    static async updateForm(_event, _form, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    static #finish() {
        this.close();
    }
}
