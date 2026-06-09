import { waitForDiceSoNice } from '../../helpers/utils.mjs';
import { emitGMUpdate, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the countdowns in this world.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export default class DhCountdowns extends HandlebarsApplicationMixin(ApplicationV2) {
    previusCountdownData = null;
    countdownChangeAnimationTimeout = null;

    constructor(options = {}) {
        super(options);

        this.previusCountdownData = 
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns).countdowns;
        this.setupHooks();
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'countdowns',
        tag: 'div',
        classes: ['daggerheart', 'dh-style', 'countdowns'],
        window: {
            icon: 'fa-solid fa-clock-rotate-left',
            frame: false,
            title: 'DAGGERHEART.UI.Countdowns.title',
            positioned: false,
            resizable: false,
            minimizable: false
        },
        actions: {
            toggleViewMode: DhCountdowns.#onToggleViewMode,
            onToggleCountdownTypes: DhCountdowns.#onToggleCountdownTypes,
            editCountdowns: DhCountdowns.#onEditCountdowns,
            loopCountdown: DhCountdowns.#onLoopCountdown,
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
            template: 'systems/daggerheart/templates/ui/countdowns/countdowns-view.hbs'
        }
    };

    /**@inheritdoc */
    async _renderFrame(options) {
        const frame = await super._renderFrame(options);

        const iconOnly =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) ===
            CONFIG.DH.GENERAL.countdownAppMode.iconOnly;
        if (iconOnly) frame.classList.add('icon-only');
        else frame.classList.remove('icon-only');

        return frame;
    }

    /** Returns countdown data filtered by ownership */
    #getCountdowns() {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const values = Object.entries(setting.countdowns).map(([key, countdown]) => ({
            key,
            countdown,
            ownership: DhCountdowns.#getPlayerOwnership(game.user, setting, countdown)
        }));
        return values.filter(v => v.ownership !== CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE);
    }

    _getCountdownData() {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const typeModes = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownTypeModes) ?? [];

        return this.#getCountdowns().reduce((acc, { key, countdown, ownership }) => {
            if (!typeModes.includes(countdown.type)) 
                return acc;

            const playersWithAccess = game.users.reduce((acc, user) => {
                const ownership = DhCountdowns.#getPlayerOwnership(user, setting, countdown);
                if (!user.isGM && ownership && ownership !== CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE) {
                    acc.push(user);
                }
                return acc;
            }, []);
            const nonGmPlayers = game.users.filter(x => !x.isGM);

            const countdownEditable = game.user.isGM || ownership === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
            const isLooping = countdown.progress.looping !== CONFIG.DH.GENERAL.countdownLoopingTypes.noLooping;
            const loopTooltip = isLooping
                ? countdown.progress.looping === CONFIG.DH.GENERAL.countdownLoopingTypes.increasing.id
                    ? 'DAGGERHEART.UI.Countdowns.increasingLoop'
                    : countdown.progress.looping === CONFIG.DH.GENERAL.countdownLoopingTypes.decreasing.id
                        ? 'DAGGERHEART.UI.Countdowns.decreasingLoop'
                        : 'DAGGERHEART.UI.Countdowns.loop'
                : null;
            const loopDisabled =
                !countdownEditable ||
                (isLooping && (countdown.progress.current > 0 || countdown.progress.start === '0'));

            acc[key] = {
                ...countdown,
                editable: countdownEditable,
                noPlayerAccess: nonGmPlayers.length && playersWithAccess.length === 0,
                shouldLoop: isLooping && countdown.progress.current === 0 && countdown.progress.start > 0,
                loopDisabled: isLooping ? loopDisabled : null,
                loopTooltip: isLooping && game.i18n.localize(loopTooltip)
            };
            return acc;
        }, {});
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.isGM = game.user.isGM;
        this.previusCountdownData = 
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns).countdowns;

        context.iconOnly =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) ===
            CONFIG.DH.GENERAL.countdownAppMode.iconOnly;

        const userCountdownTypes = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownTypeModes) ?? [];
        context.typeToggles = Object.values(CONFIG.DH.GENERAL.countdownType).map(type => ({
            type: type.id,
            label: game.i18n.localize(type.label),
            active: userCountdownTypes.includes(type.id)
        }));

        context.countdowns = this._getCountdownData();

        return context;
    }

    static #getPlayerOwnership(user, setting, countdown) {
        if (user.isGM) return CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

        const playerOwnership = countdown.ownership[user.id];
        return playerOwnership === undefined || playerOwnership === CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT
            ? setting.defaultOwnership
            : playerOwnership;
    }

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

    static async #onToggleViewMode() {
        const currentMode = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode);
        const appMode = CONFIG.DH.GENERAL.countdownAppMode;
        const newMode = currentMode === appMode.textIcon ? appMode.iconOnly : appMode.textIcon;
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode, newMode);

        if (newMode === appMode.iconOnly) this.element.classList.add('icon-only');
        else this.element.classList.remove('icon-only');
        this.render();
    }

    static async #onToggleCountdownTypes(event, target) {
        const currentTypes = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownTypeModes) ?? [];
        const { type } = target.dataset;
        const newTypes = event.shiftKey ? 
            [type] : 
            currentTypes.includes(type) ? currentTypes.filter(x => x !== type) : [...currentTypes, type];
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownTypeModes, newTypes);

        for (const type of Object.keys(CONFIG.DH.GENERAL.countdownType)) {
            const toggleElement = this.element.querySelector(`.header-type-toggles .header-type[data-type="${type}"]`);
            if (newTypes.includes(type))
                toggleElement.classList.remove('inactive');
               
            else 
                toggleElement.classList.add('inactive');
        }
  
        const updatedCountdownsElement = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/ui/countdowns/parts/countdowns.hbs',
            {
                countdowns: this._getCountdownData(),
                iconOnly: game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) ===
                    CONFIG.DH.GENERAL.countdownAppMode.iconOnly,
                isGM: game.user.isGM
            }
        );

        this.element.querySelector('#countdowns .countdowns-container').innerHTML = updatedCountdownsElement;
    }

    static async #onEditCountdowns() {
        new game.system.api.applications.ui.CountdownEdit().render(true);
    }

    static async #onLoopCountdown(_, target) {
        if (!DhCountdowns.canPerformEdit()) return;

        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const countdownId = target.closest('[data-countdown]').dataset.countdown;
        const countdown = settings.countdowns[countdownId];

        let progressMax = countdown.progress.start;
        let message = null;
        if (countdown.progress.startFormula) {
            const roll = await new Roll(countdown.progress.startFormula).evaluate();
            progressMax = roll.total;
            message = await roll.toMessage();
        }

        const newMax =
            countdown.progress.looping === CONFIG.DH.GENERAL.countdownLoopingTypes.increasing.id
                ? Number(progressMax) + 1
                : countdown.progress.looping === CONFIG.DH.GENERAL.countdownLoopingTypes.decreasing.id
                    ? Math.max(Number(progressMax) - 1, 0)
                    : progressMax;

        await waitForDiceSoNice(message);
        await settings.updateSource({
            [`countdowns.${countdownId}.progress`]: {
                current: newMax,
                start: newMax
            }
        });
        await emitGMUpdate(GMUpdateEvent.UpdateCountdowns, DhCountdowns.gmSetSetting.bind(settings), settings, null, {
            refreshType: RefreshType.Countdown
        });
    }

    static async editCountdown(increase, target) {
        if (!DhCountdowns.canPerformEdit()) return;

        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const countdownId = target.closest('[data-countdown]').dataset.countdown;
        const countdown = settings.countdowns[countdownId];
        const newCurrent = increase
            ? Math.min(countdown.progress.current + 1, countdown.progress.start)
            : Math.max(countdown.progress.current - 1, 0);
        await settings.updateSource({ [`countdowns.${countdownId}.progress.current`]: newCurrent });
        await emitGMUpdate(GMUpdateEvent.UpdateCountdowns, DhCountdowns.gmSetSetting.bind(settings), settings, null, {
            refreshType: RefreshType.Countdown
        });
    }

    static async gmSetSetting(data) {
        // if(Object.keys(data).some(x => x.includes('countdowns'))) {
        //     this.previusCountdownData = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns).countdowns;
        // }

        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, data);
        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data: { refreshType: RefreshType.Countdown }
        });
        Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });
    }

    setupHooks() {
        Hooks.on(socketEvent.Refresh, this.cooldownRefresh.bind());
    }

    async close(options) {
        /* Opt out of Foundry's standard behavior of closing all application windows marked as UI when Escape is pressed */
        if (options.closeKey) return;

        Hooks.off(socketEvent.Refresh, this.cooldownRefresh);
        return super.close(options);
    }

    /**
     * Sends updates of the countdowns to the GM player. Since this is asynchronous, be sure to
     * update all the countdowns at the same time.
     *
     * @param  {...any} progressTypes Countdowns to be updated
     */
    static async updateCountdowns(...progressTypes) {
        const { countdownAutomation } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (!countdownAutomation) return;

        const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const updatedCountdowns = Object.keys(countdownSetting.countdowns).reduce((acc, key) => {
            const countdown = countdownSetting.countdowns[key];
            if (progressTypes.indexOf(countdown.progress.type) !== -1 && countdown.progress.current > 0) {
                acc.push(key);
            }

            return acc;
        }, []);

        const countdownData = countdownSetting.toObject();
        const settings = {
            ...countdownData,
            countdowns: Object.keys(countdownData.countdowns).reduce((acc, key) => {
                const countdown = foundry.utils.deepClone(countdownData.countdowns[key]);
                if (updatedCountdowns.includes(key)) {
                    countdown.progress.current -= 1;
                }

                acc[key] = countdown;
                return acc;
            }, {})
        };
        await emitGMUpdate(GMUpdateEvent.UpdateCountdowns, DhCountdowns.gmSetSetting.bind(settings), settings, null, {
            refreshType: RefreshType.Countdown
        });
    }

    /**
     * 
     * @param {*} context 
     * @param {*} options 
     */
    async performChangeAnimations(changedCountdowns) {
        if (this.countdownChangeAnimationTimeout)
            clearTimeout(this.countdownChangeAnimationTimeout);

        this.countdownChangeAnimationTimeout = setTimeout(() => {

        }, 3000);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        this.element.hidden = !game.user.isGM && this.#getCountdowns().length === 0;
        if (options?.force) {
            document.getElementById('ui-right-column-1')?.appendChild(this.element);
        }
    }
}
