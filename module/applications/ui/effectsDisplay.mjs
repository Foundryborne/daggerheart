import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the Active Effects on a selected token.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export default class DhEffectsDisplay extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);

        this.setupHooks();
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'effects-display',
        tag: 'div',
        classes: ['daggerheart', 'dh-style', 'effects-display'],
        window: {
            frame: false,
            positioned: false,
            resizable: false,
            minimizable: false
        },
        actions: {}
    };

    /** @override */
    static PARTS = {
        resources: {
            root: true,
            template: 'systems/daggerheart/templates/ui/effects-display.hbs'
        }
    };

    get element() {
        return document.body.querySelector('.daggerheart.dh-style.effects-display');
    }

    get hidden() {
        return this.element.classList.contains('hidden');
    }

    // /**@inheritdoc */
    // async _renderFrame(options) {
    //     const frame = await super._renderFrame(options);

    //     const header = frame.querySelector('.window-header');
    //     header.querySelector('button[data-action="close"]').remove();

    //     if (game.user.isGM) {
    //         const editTooltip = game.i18n.localize('DAGGERHEART.APPLICATIONS.CountdownEdit.editTitle');
    //         const editButton = `<a style="margin-right: 8px;" class="header-control" data-tooltip="${editTooltip}" aria-label="${editTooltip}" data-action="editCountdowns"><i class="fa-solid fa-wrench"></i></a>`;
    //         header.insertAdjacentHTML('beforeEnd', editButton);
    //     }

    //     const minimizeTooltip = game.i18n.localize('DAGGERHEART.UI.Countdowns.toggleIconMode');
    //     const minimizeButton = `<a class="header-control" data-tooltip="${minimizeTooltip}" aria-label="${minimizeTooltip}" data-action="toggleViewMode"><i class="fa-solid fa-down-left-and-up-right-to-center"></i></a>`;
    //     header.insertAdjacentHTML('beforeEnd', minimizeButton);

    //     return frame;
    // }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.effects = this.getTokenEffects();

        return context;
    }

    getTokenEffects = token => {
        const actor = token
            ? token.actor
            : canvas.tokens.controlled.length === 0
              ? !game.user.isGM
                  ? game.user.character
                  : null
              : canvas.tokens.controlled[0].actor;
        return actor?.effects ?? [];
    };

    toggleHidden(token, focused) {
        const effects = this.getTokenEffects(focused ? token : null);
        this.element.hidden = !focused || effects.size === 0;
        if (effects.size > 0) this.render();
    }

    setupHooks() {
        Hooks.on('controlToken', this.toggleHidden.bind(this));
        // Hooks.on(socketEvent.Refresh, this.cooldownRefresh.bind());
    }

    async close(options) {
        /* Opt out of Foundry's standard behavior of closing all application windows marked as UI when Escape is pressed */
        if (options.closeKey) return;

        Hooks.off('controlToken', this.toggleHidden);
        // Hooks.off(socketEvent.Refresh, this.cooldownRefresh);
        return super.close(options);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element.hidden = context.effects.length === 0;
        if (options?.force) {
            document.getElementById('ui-right-column-1')?.appendChild(this.element);
        }
    }
}
