import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the countdowns in this world.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export default class DhCountdowns extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);

        this.sidebarCollapsed = true;
        this.setupHooks();
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'countdowns',
        tag: 'div',
        classes: ['daggerheart', 'dh-style', 'countdowns'],
        window: {
            icon: 'fa-solid fa-clock-rotate-left',
            frame: true,
            title: 'Fear',
            positioned: false,
            resizable: false,
            minimizable: false
        },
        actions: {
            toggleViewMode: DhCountdowns.#toggleViewMode,
            decreaseCountdown: (_, target) => this.editCountdown(false, target),
            increaseCountdown: (_, target) => this.editCountdown(true, target)
        },
        position: {
            width: 400,
            height: 222,
            top: 50
        }
    };

    /** @override */
    static PARTS = {
        resources: {
            root: true,
            template: 'systems/daggerheart/templates/ui/countdowns.hbs'
        }
    };

    get title() {
        return game.i18n.localize('DAGGERHEART.UI.Countdowns.title');
    }

    get element() {
        return document.body.querySelector('.daggerheart.dh-style.countdowns');
    }

    /**@inheritdoc */
    async _renderFrame(options) {
        const frame = await super._renderFrame(options);

        const iconOnly =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) ===
            CONFIG.DH.GENERAL.countdownAppMode.iconOnly;
        if (iconOnly) frame.classList.add('icon-only');
        else frame.classList.remove('icon-only');

        const header = frame.querySelector('.window-header');
        header.querySelector('button[data-action="close"]').remove();

        const minimizeTooltip = game.i18n.localize('DAGGERHEART.UI.Countdowns.toggleIconMode');
        const minimizeButton = `<a class="header-control" data-tooltip="${minimizeTooltip}" aria-label="${minimizeTooltip}" data-action="toggleViewMode"><i class="fa-solid fa-down-left-and-up-right-to-center"></i></a>`;
        header.insertAdjacentHTML('beforeEnd', minimizeButton);

        return frame;
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.sidebarCollapsed = this.sidebarCollapsed;
        context.iconOnly =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) ===
            CONFIG.DH.GENERAL.countdownAppMode.iconOnly;

        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        context.countdowns = Object.keys(setting.countdowns).reduce((acc, key) => {
            const countdown = setting.countdowns[key];
            const playerOwnership = countdown.ownership[game.user.id];
            const ownership =
                playerOwnership === CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT
                    ? setting.defaultOwnership
                    : playerOwnership;
            if (ownership === CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE) return acc;

            acc[key] = {
                ...countdown,
                editable: game.user.isGM || ownership === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
            };
            return acc;
        }, {});

        return context;
    }

    toggleCollapsedPosition = async (_, collapsed) => {
        this.sidebarCollapsed = collapsed;
        if (!collapsed) this.element.classList.add('expanded');
        else this.element.classList.remove('expanded');
    };

    cooldownRefresh = ({ refreshType }) => {
        if (refreshType === RefreshType.Countdown) this.render();
    };

    static canPerformEdit() {
        if (game.user.isGM) return true;

        const noGM = !game.users.find(x => x.isGM && x.active);
        if (noGM) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));
            return false;
        }

        return true;
    }

    static async #toggleViewMode() {
        const currentMode = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode);
        const appMode = CONFIG.DH.GENERAL.countdownAppMode;
        const newMode = currentMode === appMode.textIcon ? appMode.iconOnly : appMode.textIcon;
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode, newMode);

        if (newMode === appMode.iconOnly) this.element.classList.add('icon-only');
        else this.element.classList.remove('icon-only');
        this.render();
    }

    static async editCountdown(increase, target) {
        if (!DhCountdowns.canPerformEdit()) return;

        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const countdown = settings.countdowns[target.id];
        const newCurrent = increase
            ? Math.min(countdown.progress.current + 1, countdown.progress.max)
            : Math.max(countdown.progress.current - 1, 0);
        await settings.updateSource({ [`countdowns.${target.id}.progress.current`]: newCurrent });
        await emitAsGM(GMUpdateEvent.UpdateCountdowns, DhCountdowns.gmSetSetting.bind(settings), settings, null, {
            refreshType: RefreshType.Countdown
        });
    }

    static async gmSetSetting(data) {
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, data),
            game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: { refreshType: RefreshType.Countdown }
            });
        Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });
    }

    setupHooks() {
        Hooks.on('collapseSidebar', this.toggleCollapsedPosition.bind());
        Hooks.on(socketEvent.Refresh, this.cooldownRefresh.bind());
    }

    close(options) {
        Hooks.off('collapseSidebar', this.toggleCollapsedPosition);
        Hooks.off(socketEvent.Refresh, this.cooldownRefresh);
        super.close(options);
    }

    static async updateCountdowns(progressType) {
        const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const updatedCountdowns = Object.keys(countdownSetting.countdowns).reduce((acc, key) => {
            const countdown = countdownSetting.countdowns[key];
            if (countdown.progress.type === progressType && countdown.progress.current > 0) {
                acc.push(key);
            }

            return acc;
        }, []);

        const countdownData = countdownSetting.toObject();
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, {
            ...countdownData,
            countdowns: Object.keys(countdownData.countdowns).reduce((acc, key) => {
                const countdown = foundry.utils.deepClone(countdownData.countdowns[key]);
                if (updatedCountdowns.includes(key)) {
                    countdown.progress.current -= 1;
                }

                acc[key] = countdown;
                return acc;
            }, {})
        });

        const data = { refreshType: RefreshType.Countdown };
        await game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data
        });
        Hooks.callAll(socketEvent.Refresh, data);
    }
}
