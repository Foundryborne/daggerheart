import { emitAsGM, GMUpdateEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the Users defined for this world.
 * Currently active users are always displayed, while inactive users can be displayed on toggle.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export default class FearTracker extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'resources',
        classes: [],
        tag: 'div',
        window: {
            frame: true,
            title: 'Fear',
            positioned: true,
            resizable: true,
            minimizable: false
        },
        actions: {
            setFear: FearTracker.setFear,
            increaseFear: FearTracker.increaseFear
        },
        position: {
            width: 222,
            height: 222
            // top: "200px",
            // left: "120px"
        }
    };

    /** @override */
    static PARTS = {
        resources: {
            root: true,
            template: 'systems/daggerheart/templates/ui/fearTracker.hbs'
        }
    };

    get currentFear() {
        return game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear);
    }

    get maxFear() {
        return game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxFear;
    }

    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(_options) {
        const display = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).displayFear,
            current = this.currentFear,
            max = this.maxFear,
            percent = (current / max) * 100,
            isGM = game.user.isGM;
        // Return the data for rendering
        return { display, current, max, percent, isGM };
    }

    /** @override */
    async _preFirstRender(context, options) {
        options.position =
            game.user.getFlag(CONFIG.DH.id, 'app.resources.position') ?? FearTracker.DEFAULT_OPTIONS.position;
    }

    /** @override */
    async _preRender(context, options) {
        if (this.currentFear > this.maxFear && game.user.isGM)
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear, this.maxFear);
    }

    _onPosition(position) {
        game.user.setFlag(CONFIG.DH.id, 'app.resources.position', position);
    }

    async close(options = {}) {
        if (!options.allowed) return;
        else super.close(options);
    }

    static async setFear(event, target) {
        if (!game.user.isGM) return;
        const fearCount = Number(target.dataset.index ?? 0);
        await this.updateFear(this.currentFear === fearCount + 1 ? fearCount : fearCount + 1);
    }

    static async increaseFear(event, target) {
        if (!game.user.isGM) return;
        let value = target.dataset.increment ?? 0,
            operator = value.split('')[0] ?? null;
        value = Number(value);
        await this.updateFear(operator ? this.currentFear + value : value);
    }

    async updateFear(value) {
        return emitAsGM(
            GMUpdateEvent.UpdateFear,
            game.settings.set.bind(game.settings, CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear),
            value
        );
    }
}
