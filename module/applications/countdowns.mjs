import { countdownTypes } from '../config/generalConfig.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

class Countdowns extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(basePath) {
        super({});

        this.basePath = basePath;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.Countdown.Title', {
            type: game.i18n.localize(`DAGGERHEART.Countdown.Types.${this.basePath}`)
        });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'countdown'],
        tag: 'form',
        position: { width: 740, height: 700 },
        window: {
            frame: true,
            title: 'Countdowns',
            resizable: true,
            minimizable: true
        },
        actions: {
            addCountdown: this.addCountdown,
            removeCountdown: this.removeCountdown,
            editImage: this.onEditImage
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        countdowns: {
            template: 'systems/daggerheart/templates/views/countdowns.hbs',
            scrollable: ['.expanded-view']
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.mini-countdown-container').forEach(element => {
            element.addEventListener('click', event => this.updateCountdownValue.bind(this)(event, true));
            element.addEventListener('contextmenu', event => this.updateCountdownValue.bind(this)(event, false));
        });
    }

    async _onFirstRender(context, options) {
        super._onFirstRender(context, options);

        this.element.querySelector('.expanded-view').classList.toggle('hidden');
        this.element.querySelector('.minimized-view').classList.toggle('hidden');
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        const countdownData = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns)[this.basePath];

        context.base = this.basePath;
        context.source = countdownData.toObject();
        context.systemFields = countdownData.schema.fields;
        context.countdownFields = context.systemFields.countdowns.element.fields;
        context.minimized = this.minimized || _options.isFirstRender;

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

    async minimize() {
        await super.minimize();

        this.element.querySelector('.expanded-view').classList.toggle('hidden');
        this.element.querySelector('.minimized-view').classList.toggle('hidden');
    }

    async maximize() {
        if (this.minimized) {
            this.element.querySelector('.expanded-view').classList.toggle('hidden');
            this.element.querySelector('.minimized-view').classList.toggle('hidden');
        }

        await super.maximize();
    }

    static onEditImage(_, target) {
        const setting = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns)[this.basePath];
        const current = setting.countdowns[target.dataset.countdown].img;
        const fp = new FilePicker({
            current,
            type: 'image',
            callback: async path => this.updateImage.bind(this)(path, target.dataset.countdown),
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    async updateImage(path, countdown) {
        const setting = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns);
        await setting.updateSource({
            [`${this.basePath}.countdowns.${countdown}.img`]: path
        });

        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, setting);
        this.render();
    }

    async updateCountdownValue(event, increase) {
        const countdownSetting = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns);
        const countdown = countdownSetting[this.basePath].countdowns[event.currentTarget.dataset.countdown];
        const currentValue = countdown.progress.current;

        if (increase && currentValue === countdown.progress.max) return;
        if (!increase && currentValue === 0) return;

        await countdownSetting.updateSource({
            [`${this.basePath}.countdowns.${event.currentTarget.dataset.countdown}.progress.current`]: increase
                ? currentValue + 1
                : currentValue - 1
        });

        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, countdownSetting.toObject());
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
        const countdownName = countdownSetting[this.basePath].countdowns[target.dataset.countdown].name;

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize('DAGGERHEART.Countdown.RemoveCountdownTitle')
            },
            content: game.i18n.format('DAGGERHEART.Countdown.RemoveCountdownText', { name: countdownName })
        });
        if (!confirmed) return;

        await countdownSetting.updateSource({ [`${this.basePath}.countdowns.-=${target.dataset.countdown}`]: null });

        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, countdownSetting.toObject());
        this.render();
    }

    async open() {
        await this.render(true);
        if (
            Object.keys(game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns)[this.basePath].countdowns)
                .length > 0
        ) {
            this.minimize();
        }
    }
}

export class NarrativeCountdowns extends Countdowns {
    constructor() {
        super('narrative');
    }

    static DEFAULT_OPTIONS = {
        id: 'narrative-countdowns'
    };
}

export class EncounterCountdowns extends Countdowns {
    constructor() {
        super('encounter');
    }

    static DEFAULT_OPTIONS = {
        id: 'encounter-countdowns'
    };
}

export const registerCountdownHooks = () => {
    const updateCountdowns = async shouldIncrease => {
        if (game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation).countdowns) {
            const countdownSetting = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns);
            for (let countdownCategoryKey in countdownSetting) {
                const countdownCategory = countdownSetting[countdownCategoryKey];
                for (let countdownKey in countdownCategory.countdowns) {
                    const countdown = countdownCategory.countdowns[countdownKey];

                    if (shouldIncrease(countdown)) {
                        await countdownSetting.updateSource({
                            [`${countdownCategoryKey}.countdowns.${countdownKey}.progress.current`]:
                                countdown.progress.current + 1
                        });
                        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, countdownSetting);
                        foundry.applications.instances.get(`${countdownCategoryKey}-countdowns`)?.render();
                    }
                }
            }
        }
    };

    Hooks.on(SYSTEM.HOOKS.characterAttack, async () => {
        updateCountdowns(countdown => {
            return (
                countdown.progress.type.value === countdownTypes.characterAttack.id &&
                countdown.progress.current < countdown.progress.max
            );
        });
    });

    Hooks.on(SYSTEM.HOOKS.spotlight, async () => {
        updateCountdowns(countdown => {
            return (
                countdown.progress.type.value === countdownTypes.spotlight.id &&
                countdown.progress.current < countdown.progress.max
            );
        });
    });
};
