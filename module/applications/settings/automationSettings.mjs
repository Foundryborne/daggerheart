import { DhAutomation } from '../../data/settings/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhAutomationSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhAutomation(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-automation-settings',
        classes: ['daggerheart', 'dh-style', 'dialog', 'setting'],
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
            template: 'systems/daggerheart/templates/settings/automation-settings.hbs'
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
        this.settings = new DhAutomation();
        this.render();
    }

    static async save() {
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation, this.settings.toObject());
        this.close();
    }
}
