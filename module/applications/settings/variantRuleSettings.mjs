import DhVariantRules from '../../data/settings/VariantRules.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHVariantRuleSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhVariantRules(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-appearance-settings',
        classes: ['daggerheart', 'dialog', 'dh-style', 'setting'],
        position: { width: '600', height: 'auto' },
        window: {
            icon: 'fa-solid fa-gears'
        },
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
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules, this.settings.toObject());
        this.close();
    }
}
