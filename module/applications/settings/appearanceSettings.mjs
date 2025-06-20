import DhAppearance, { DualityRollColor } from '../../data/settings/Appearance.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHAppearanceSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhAppearance(
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.name');
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
            template: 'systems/daggerheart/templates/settings/appearance-settings.hbs'
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
        this.settings = new DhAppearance();
        this.render();
    }

    static async save() {
        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance, this.settings.toObject());
        document.body.classList.toggle(
            'theme-colorful',
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).dualityColorScheme ===
                DualityRollColor.colorful.value
        );

        this.close();
    }
}
