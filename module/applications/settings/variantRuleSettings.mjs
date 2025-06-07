import DhVariantRules from '../../data/settings/VariantRules.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHVariantRuleSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhVariantRules(
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.variantRules).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.name');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-appearance-settings',
        classes: ['daggerheart', 'setting', 'dh-style'],
        position: { width: '600', height: 'auto' },
        actions: {
            reset: this.reset,
            save: this.save
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/settings/variant-rules.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.settingFields = this.settings;

        return context;
    }

    static async updateData(event, element, formData) {
        const updatedSettings = foundry.utils.expandObject(formData.object);

        await this.settings.updateSource(updatedSettings);
        this.render();
    }

    static async reset() {
        this.settings = new DhVariantRules();
        this.render();
    }

    static async save() {
        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.variantRules, this.settings.toObject());
        this.close();
    }
}
