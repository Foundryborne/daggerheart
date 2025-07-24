import { DhRangeMeasurement } from '../../data/settings/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhRangeMeasurementSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhRangeMeasurement(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.RangeMeasurement).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-automation-settings',
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
            template: 'systems/daggerheart/templates/settings/range-measurement-settings.hbs'
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
        this.settings = new DhRangeMeasurement();
        this.render();
    }

    static async save() {
        await game.settings.set(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.RangeMeasurement,
            this.settings.toObject()
        );
        this.close();
    }
}
