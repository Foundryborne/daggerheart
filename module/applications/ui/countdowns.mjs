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
    previousCountdownData = null;

    constructor(options = {}) {
        super(options);
        this.previousCountdownData = 
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns).countdowns;
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
            toggleCountdownTypes: DhCountdowns.#onToggleCountdownTypes,
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

    /** 
     * Returns all visible countdown types
     * @returns {string[]}
     */
    get visibleCountdownTypes() {
        const { encounter, narrative } = CONFIG.DH.GENERAL.countdownTypes;
        return game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownTypeModes) 
            ?? [encounter.id, narrative.id];
    }

    async _renderFrame(options) {
        const frame = await super._renderFrame(options);

        const iconOnly =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) ===
            CONFIG.DH.GENERAL.countdownAppMode.iconOnly;
        if (iconOnly) frame.classList.add('icon-only');
        else frame.classList.remove('icon-only');

        return frame;
    }

    /** @inheritdoc */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this._createContextMenu(this._getCountdownContextOptions, '.countdown-container[data-countdown]', {
            parentClassHooks: false, fixed: true
        });
    }
    
    /** @inheritdoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        /* Handle rendering/hiding/positioning of the countdown UI */
        this.element.hidden = !game.user.isGM && this.#getCountdowns().length === 0;
        if (options?.force) {
            document.getElementById('ui-right-column-1')?.appendChild(this.element);
        }

        this.previousCountdownData = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)
            .countdowns;

        /* Handle animations to draw attention to countdown values changing */
        const typesToAnimate = new Set();
        for (const countdownKey of options.animate ?? []) {
            const shimmerAnimation = [
                { backgroundPositionX: '98%' },
                { backgroundPositionX: '0%' }
            ];
            const shimmerTiming = {
                duration: 1000,
                iterations: 1
            };

            const element = this.element.querySelector(`.countdown-container[data-countdown="${countdownKey}"]`);
            element?.animate(shimmerAnimation, shimmerTiming);

            const countdown = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)
                .countdowns[countdownKey];
            if (!this.visibleCountdownTypes.includes(countdown?.type)) 
                typesToAnimate.add(countdown.type);
        }

        for (const type of typesToAnimate) {
            const pulseAnimation = [
                { boxShadow: '0 0 1px 1px var(--golden)' },
                { boxShadow: '0 0 2px 2px var(--golden)' }
            ];
            const pulseTiming = {
                duration: 1000,
                iterations: 3
            };

            const element = this.element.querySelector(`.header-type-toggles .header-type[data-type="${type}"]`);
            element?.animate(pulseAnimation, pulseTiming);
        }
    }

    /** Returns countdown data filtered by ownership */
    #getCountdowns() {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const values = Object.entries(setting.countdowns).map(([key, countdown]) => ({
            key,
            countdown,
            ownership: countdown.getUserLevel(game.user)
        }));
        return values.filter(v => v.ownership !== CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE);
    }

    _getCountdownData() {
        return this.#getCountdowns().reduce((acc, { key, countdown, ownership }) => {
            const playersWithAccess = game.users.reduce((acc, user) => {
                const ownership = countdown.getUserLevel(user);
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

            acc[countdown.type][key] = {
                ...countdown,
                editable: countdownEditable,
                noPlayerAccess: nonGmPlayers.length && playersWithAccess.length === 0,
                shouldLoop: isLooping && countdown.progress.current === 0 && countdown.progress.start > 0,
                loopDisabled: isLooping ? loopDisabled : null,
                loopTooltip: isLooping && game.i18n.localize(loopTooltip)
            };
            return acc;
        }, Object.keys(CONFIG.DH.GENERAL.countdownTypes).reduce((acc, key) => {
            acc[key] = {};
            return acc;
        }, {}));
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.isGM = game.user.isGM;

        context.iconOnly =
            game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode) 
            === CONFIG.DH.GENERAL.countdownAppMode.iconOnly;

        context.userCountdownTypes = this.visibleCountdownTypes;

        context.typeToggles = 
            Object.values(CONFIG.DH.GENERAL.countdownTypes).map(type => ({
                type: type.id,
                label: game.i18n.localize(type.shortLabel),
                active: context.userCountdownTypes.includes(type.id)
            }));

        context.countdowns = this._getCountdownData();
        context.countdownTypesWithVisibleEntries = this.#getCountdowns().reduce((acc, data) => {
            if (context.userCountdownTypes.includes(data.countdown.type) && !acc.includes(data.countdown.type)) 
                acc.push(data.countdown.type);

            return acc;
        }, []);
        

        return context;
    }

    static canPerformEdit() {
        if (game.user.isGM) return true;

        const noGM = !game.users.find(x => x.isGM && x.active);
        if (noGM) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));
            return false;
        }

        return true;
    }

    /** @this {DhCountdowns} */
    static async #onToggleViewMode() {
        const currentMode = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode);
        const appMode = CONFIG.DH.GENERAL.countdownAppMode;
        const newMode = currentMode === appMode.textIcon ? appMode.iconOnly : appMode.textIcon;
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownMode, newMode);

        if (newMode === appMode.iconOnly) this.element.classList.add('icon-only');
        else this.element.classList.remove('icon-only');
        this.render();
    }

    /** @this {DhCountdowns} */
    static async #onToggleCountdownTypes(event, target) {
        const currentTypes = this.visibleCountdownTypes;
        const { type } = target.dataset;
        const newTypes = event.shiftKey ? 
            [type] : 
            currentTypes.includes(type) ? currentTypes.filter(x => x !== type) : [...currentTypes, type];
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.countdownTypeModes, newTypes);

        this.render();
    }

    /** @this {DhCountdowns} */
    static async #onEditCountdowns() {
        new game.system.api.applications.ui.CountdownEdit().render(true);
    }

    /** @this {DhCountdowns} */
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
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, data);
        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data: { refreshType: RefreshType.Countdown }
        });
    }

    async close(options) {
        /* Opt out of Foundry's standard behavior of closing all application windows marked as UI when Escape is pressed */
        if (options.closeKey) return;

        return super.close(options);
    }

    /**
     * Sends updates of the countdowns to the GM player. Since this is asynchronous, be sure to
     * update all the countdowns at the same time.
     *
     * @param  {...(string | { type: string; undo?: boolean })} progressTypes Countdowns to be updated
     */
    static async updateCountdowns(...progressTypes) {
        progressTypes = progressTypes.map(p => typeof p === 'string' ? { type: p } : p);
        const { countdownAutomation } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (!countdownAutomation) return;

        const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const updatedCountdowns = Object.keys(countdownSetting.countdowns).reduce((acc, key) => {
            const countdown = countdownSetting.countdowns[key];
            const progressData = progressTypes.find(x => x.type === countdown.progress.type);
            if (progressData && countdown.progress.current > 0) {
                acc[key] = { value: progressData.undo ? 1 : -1 };
            }

            return acc;
        }, {});

        const countdownData = countdownSetting.toObject();
        const settings = {
            ...countdownData,
            countdowns: Object.keys(countdownData.countdowns).reduce((acc, key) => {
                const countdown = foundry.utils.deepClone(countdownData.countdowns[key]);
                if (updatedCountdowns[key]) {
                    countdown.progress.current += updatedCountdowns[key].value;
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
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]}
     */
    _getCountdownContextOptions() {
        /** @param {HTMLElement} element */
        const getCountdownFromElement = element => {
            const id = element.closest('[data-countdown]').dataset.countdown;
            if (!id) return null;
            const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
            return setting.countdowns[id ?? ''];
        }

        return [
            {
                label: 'CONTROLS.CommonDelete',
                icon: 'fa-solid fa-trash',
                visible: element => {
                    return getCountdownFromElement(element)?.isOwner;
                },
                onClick: (_, target) => {
                    getCountdownFromElement(target)?.delete();
                }
            }
        ];
    }
}
