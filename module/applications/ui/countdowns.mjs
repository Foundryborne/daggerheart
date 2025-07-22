import { GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';
import constructHTMLButton from '../../helpers/utils.mjs';
import OwnershipSelection from '../dialogs/ownershipSelection.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

class Countdowns extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(basePath) {
        super({});

        this.basePath = basePath;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.Countdown.title', {
            type: game.i18n.localize(`DAGGERHEART.APPLICATIONS.Countdown.types.${this.basePath}`)
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
            minimizable: false
        },
        actions: {
            addCountdown: this.addCountdown,
            removeCountdown: this.removeCountdown,
            editImage: this.onEditImage,
            openOwnership: this.openOwnership,
            openCountdownOwnership: this.openCountdownOwnership,
            toggleSimpleView: this.toggleSimpleView
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        countdowns: {
            template: 'systems/daggerheart/templates/ui/countdowns.hbs',
            scrollable: ['.expanded-view']
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.mini-countdown-container').forEach(element => {
            element.addEventListener('click', event => this.updateCountdownValue.bind(this)(event, false));
            element.addEventListener('contextmenu', event => this.updateCountdownValue.bind(this)(event, true));
        });
    }

    async _preFirstRender(context, options) {
        options.position =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS[`${this.basePath}Countdown`].position) ??
            Countdowns.DEFAULT_OPTIONS.position;

        const viewSetting =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS[`${this.basePath}Countdown`].simple) ?? !game.user.isGM;
        this.simpleView =
            game.user.isGM || !this.testUserPermission(CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) ? viewSetting : true;
        context.simple = this.simpleView;
    }

    _onPosition(position) {
        game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS[`${this.basePath}Countdown`].position, position);
    }

    async _renderFrame(options) {
        const frame = await super._renderFrame(options);

        if (this.testUserPermission(CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
            const button = constructHTMLButton({
                label: '',
                classes: ['header-control', 'icon', 'fa-solid', 'fa-wrench'],
                dataset: { action: 'toggleSimpleView', tooltip: 'DAGGERHEART.APPLICATIONS.Countdown.toggleSimple' }
            });
            this.window.controls.after(button);
        }

        return frame;
    }

    testUserPermission(level, exact, altSettings) {
        if (game.user.isGM) return true;

        const settings =
            altSettings ?? game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)[this.basePath];
        const defaultAllowed = exact ? settings.ownership.default === level : settings.ownership.default >= level;
        const userAllowed = exact
            ? settings.playerOwnership[game.user.id]?.value === level
            : settings.playerOwnership[game.user.id]?.value >= level;
        return defaultAllowed || userAllowed;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        const countdownData = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)[
            this.basePath
        ];

        context.isGM = game.user.isGM;
        context.base = this.basePath;

        context.canCreate = this.testUserPermission(CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER, true);
        context.source = {
            ...countdownData,
            countdowns: Object.keys(countdownData.countdowns).reduce((acc, key) => {
                const countdown = countdownData.countdowns[key];

                if (this.testUserPermission(CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED, false, countdown)) {
                    acc[key] = {
                        ...countdown,
                        canEdit: this.testUserPermission(CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER, true, countdown)
                    };
                }

                return acc;
            }, {})
        };
        context.systemFields = countdownData.schema.fields;
        context.countdownFields = context.systemFields.countdowns.element.fields;
        context.simple = this.simpleView;

        return context;
    }

    static async updateData(event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);
        const newSetting = foundry.utils.mergeObject(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns).toObject(),
            data
        );

        if (game.user.isGM) {
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, newSetting);
            this.render();
        } else {
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateSetting,
                    uuid: CONFIG.DH.SETTINGS.gameSettings.Countdowns,
                    update: newSetting
                }
            });
        }
    }

    async updateSetting(update) {
        if (game.user.isGM) {
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, update);
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: {
                    refreshType: RefreshType.Countdown,
                    application: `${this.basePath}-countdowns`
                }
            });

            this.render();
        } else {
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateSetting,
                    uuid: CONFIG.DH.SETTINGS.gameSettings.Countdowns,
                    update: update,
                    refresh: { refreshType: RefreshType.Countdown, application: `${this.basePath}-countdowns` }
                }
            });
        }
    }

    static onEditImage(_, target) {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)[this.basePath];
        const current = setting.countdowns[target.dataset.countdown].img;
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current,
            type: 'image',
            callback: async path => this.updateImage.bind(this)(path, target.dataset.countdown),
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    async updateImage(path, countdown) {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        await setting.updateSource({
            [`${this.basePath}.countdowns.${countdown}.img`]: path
        });

        await this.updateSetting(setting);
    }

    static openOwnership(_, target) {
        new Promise((resolve, reject) => {
            const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)[this.basePath];
            const ownership = { default: setting.ownership.default, players: setting.playerOwnership };
            new OwnershipSelection(resolve, reject, this.title, ownership).render(true);
        }).then(async ownership => {
            const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
            await setting.updateSource({
                [`${this.basePath}.ownership`]: ownership
            });

            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, setting.toObject());
            this.render();
        });
    }

    static openCountdownOwnership(_, target) {
        const countdownId = target.dataset.countdown;
        new Promise((resolve, reject) => {
            const countdown = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)[this.basePath]
                .countdowns[countdownId];
            const ownership = { default: countdown.ownership.default, players: countdown.playerOwnership };
            new OwnershipSelection(resolve, reject, countdown.name, ownership).render(true);
        }).then(async ownership => {
            const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
            await setting.updateSource({
                [`${this.basePath}.countdowns.${countdownId}.ownership`]: ownership
            });

            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, setting);
            this.render();
        });
    }

    static async toggleSimpleView() {
        this.simpleView = !this.simpleView;
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS[`${this.basePath}Countdown`].simple, this.simpleView);
        this.render();
    }

    async updateCountdownValue(event, increase) {
        const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const countdown = countdownSetting[this.basePath].countdowns[event.currentTarget.dataset.countdown];

        if (!this.testUserPermission(CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
            return;
        }

        const currentValue = countdown.progress.current;

        if (increase && currentValue === countdown.progress.max) return;
        if (!increase && currentValue === 0) return;

        await countdownSetting.updateSource({
            [`${this.basePath}.countdowns.${event.currentTarget.dataset.countdown}.progress.current`]: increase
                ? currentValue + 1
                : currentValue - 1
        });

        await this.updateSetting(countdownSetting.toObject());
    }

    static async addCountdown() {
        const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        await countdownSetting.updateSource({
            [`${this.basePath}.countdowns.${foundry.utils.randomID()}`]: {
                name: game.i18n.localize('DAGGERHEART.APPLICATIONS.Countdown.newCountdown'),
                ownership: game.user.isGM
                    ? {}
                    : {
                          players: {
                              [game.user.id]: { type: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
                          }
                      }
            }
        });

        await this.updateSetting(countdownSetting.toObject());
    }

    static async removeCountdown(_, target) {
        const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const countdownName = countdownSetting[this.basePath].countdowns[target.dataset.countdown].name;

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize('DAGGERHEART.APPLICATIONS.Countdown.removeCountdownTitle')
            },
            content: game.i18n.format('DAGGERHEART.APPLICATIONS.Countdown.removeCountdownText', { name: countdownName })
        });
        if (!confirmed) return;

        await countdownSetting.updateSource({ [`${this.basePath}.countdowns.-=${target.dataset.countdown}`]: null });

        await this.updateSetting(countdownSetting.toObject());
    }

    async open() {
        await this.render(true);
        if (
            Object.keys(
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)[this.basePath].countdowns
            ).length > 0
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

export async function updateCountdowns(progressType) {
    const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
    const update = Object.keys(countdownSetting).reduce((update, typeKey) => {
        return foundry.utils.mergeObject(
            update,
            Object.keys(countdownSetting[typeKey].countdowns).reduce((acc, countdownKey) => {
                const countdown = countdownSetting[typeKey].countdowns[countdownKey];
                if (countdown.progress.current > 0 && countdown.progress.type.value === progressType) {
                    acc[`${typeKey}.countdowns.${countdownKey}.progress.current`] = countdown.progress.current - 1;
                }

                return acc;
            }, {})
        );
    }, {});

    await countdownSetting.updateSource(update);
    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, countdownSetting);

    const data = { refreshType: RefreshType.Countdown };
    await game.socket.emit(`system.${CONFIG.DH.id}`, {
        action: socketEvent.Refresh,
        data
    });
    Hooks.callAll(socketEvent.Refresh, data);
}
