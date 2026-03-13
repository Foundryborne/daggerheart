import { DhMetagaming } from '../../data/settings/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhMetagamingSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhMetagaming(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-metagaming-settings',
        classes: ['daggerheart', 'dh-style', 'dialog', 'setting'],
        position: { width: '600', height: 'auto' },
        window: {
            icon: 'fa-solid fa-eye-low-vision'
        },
        actions: {
            reset: this.reset,
            save: this.save
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/settings/metagaming-settings/header.hbs' },
        general: { template: 'systems/daggerheart/templates/settings/metagaming-settings/general.hbs' },
        footer: { template: 'systems/daggerheart/templates/settings/metagaming-settings/footer.hbs' }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.settingFields = this.settings;

        return context;
    }

    static async updateData(_event, _element, formData) {
        const updatedSettings = foundry.utils.expandObject(formData.object);

        await this.settings.updateSource(updatedSettings);
        this.render();
    }

    static async reset() {
        this.settings = new DhMetagaming();
        this.render();
    }

    static async save() {
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming, this.settings.toObject());
        this.close();
    }
}
