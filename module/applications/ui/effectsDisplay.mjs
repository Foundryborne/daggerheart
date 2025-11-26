import { RefreshType } from '../../systemRegistration/socket.mjs';

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

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        if (this.element) {
            this.element.querySelectorAll('.effect-container a').forEach(element => {
                element.addEventListener('contextmenu', this.removeEffect.bind(this));
            });
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.effects = DhEffectsDisplay.getTokenEffects();

        return context;
    }

    static getTokenEffects = token => {
        const actor = token
            ? token.actor
            : canvas.tokens.controlled.length === 0
              ? !game.user.isGM
                  ? game.user.character
                  : null
              : canvas.tokens.controlled[0].actor;
        return actor?.getActiveEffects() ?? [];
    };

    toggleHidden(token, focused) {
        const effects = DhEffectsDisplay.getTokenEffects(focused ? token : null);
        this.element.hidden = effects.length === 0;

        Hooks.callAll(CONFIG.DH.HOOKS.effectDisplayToggle, this.element.hidden, token);

        this.render();
    }

    async removeEffect(event) {
        const element = event.target.closest('.effect-container');
        const effects = DhEffectsDisplay.getTokenEffects();
        const effect = effects.find(x => x.id === element.id);
        await effect.delete();
        this.render();
    }

    setupHooks() {
        Hooks.on('controlToken', this.toggleHidden.bind(this));
        Hooks.on(RefreshType.EffectsDisplay, this.toggleHidden.bind(this));
    }

    async close(options) {
        /* Opt out of Foundry's standard behavior of closing all application windows marked as UI when Escape is pressed */
        if (options.closeKey) return;

        Hooks.off('controlToken', this.toggleHidden);
        Hooks.off(RefreshType.EffectsDisplay, this.toggleHidden);
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
