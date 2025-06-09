const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class Countdowns extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(basePath) {
        super();

        this.basePath = basePath;
    }

    static DEFAULT_OPTIONS = {
        id: 'countdown',
        classes: [],
        tag: 'form',
        window: {
            frame: true,
            title: 'Countdowns',
            resizable: true,
            minimizable: true
        },
        actions: {
            addCountdown: this.addCountdown,
            removeCountdown: this.removeCountdown
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        countdowns: {
            template: 'systems/daggerheart/templates/views/countdowns.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        const countdownData = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns)[this.basePath];

        context.base = this.basePath;
        context.source = countdownData.toObject();
        context.systemFields = countdownData.schema.fields;
        context.countdownFields = context.systemFields.countdowns.element.fields;

        return context;
    }

    static async updateData(event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);
        const newSetting = foundry.utils.mergeObject(
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns).toObject(),
            data
        );
        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, newSetting);
        this.render();
    }

    static async addCountdown() {
        const countdownSetting = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns);
        await countdownSetting.updateSource({
            [`${this.basePath}.countdowns.${foundry.utils.randomID()}`]: {
                name: game.i18n.localize('DAGGERHEART.Countdown.NewCountdown')
            }
        });

        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, countdownSetting.toObject());
        this.render();
    }

    static async removeCountdown(_, target) {
        const countdownSetting = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns);
        await countdownSetting.updateSource({ [`${this.basePath}.countdowns.-=${target.dataset.countdown}`]: null });

        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, countdownSetting.toObject());
        this.render();
    }
}
