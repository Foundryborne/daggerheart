import { DhRangeMeasurement } from '../../data/settings/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhRangeMeasurementSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhRangeMeasurement(
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.RangeMeasurement).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Name');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-automation-settings',
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
        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.RangeMeasurement, this.settings.toObject());
        this.close();
    }
}
