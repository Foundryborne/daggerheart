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
        const header = frame.querySelector('.window-header');
        header.querySelector('button[data-action="close"]').remove();

        const minimizeTooltip = game.i18n.localize('DAGGERHEART.UI.Countdowns.minimize');
        const minimizeButton = `<a class="header-control" data-tooltip="${minimizeTooltip}" aria-label="${minimizeTooltip}" data-action="minimize"><i class="fa-solid fa-down-left-and-up-right-to-center"></i></a>`;
        header.insertAdjacentHTML('beforeEnd', minimizeButton);

        return frame;
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.sidebarCollapsed = this.sidebarCollapsed;

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

    static async editCountdown(increase, target) {
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
}
