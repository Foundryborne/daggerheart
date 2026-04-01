import { RefreshFeatures } from '../../../helpers/utils.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;
/**
 * The daggerheart menu tab.
 * @extends {AbstractSidebarTab}
 * @mixes HandlebarsApplication
 */
export default class DaggerheartMenu extends HandlebarsApplicationMixin(AbstractSidebarTab) {
    constructor(options) {
        super(options);

        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();
    }

    static defaultRefreshSelections() {
        return {
            session: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.session') },
            scene: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.scene') },
            longRest: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.longrest') },
            shortRest: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.shortrest') }
        };
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['dh-style', 'directory'],
        window: {
            title: 'SIDEBAR.TabSettings'
        },
        actions: {
            selectRefreshable: DaggerheartMenu.#selectRefreshable,
            refreshActors: DaggerheartMenu.#refreshActors,
            createFallCollisionDamage: DaggerheartMenu.#createFallCollisionDamage
        }
    };

    /** @override */
    static tabName = 'daggerheartMenu';

    /** @override */
    static PARTS = {
        main: { template: 'systems/daggerheart/templates/sidebar/daggerheart-menu/main.hbs' }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.refreshables = this.refreshSelections;
        context.disableRefresh = Object.values(this.refreshSelections).every(x => !x.selected);
        context.fallAndCollision = CONFIG.DH.GENERAL.fallAndCollisionDamage;

        return context;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    static async #selectRefreshable(_event, button) {
        const { type } = button.dataset;
        this.refreshSelections[type].selected = !this.refreshSelections[type].selected;
        this.render();
    }

    static async #refreshActors() {
        const refreshKeys = Object.keys(this.refreshSelections).filter(key => this.refreshSelections[key].selected);
        await RefreshFeatures(refreshKeys);

        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();
        this.render();
    }

    static async #createFallCollisionDamage(_event, button) {
        const data = CONFIG.DH.GENERAL.fallAndCollisionDamage[button.dataset.key];
        const roll = new Roll(data.damageFormula);
        await roll.evaluate();

        /* class BaseRoll needed to get rendered by foundryRoll.hbs */
        const rollJSON = roll.toJSON();
        rollJSON.class = 'BaseRoll';

        foundry.documents.ChatMessage.implementation.create({
            title: game.i18n.localize(data.chatTitle),
            author: game.user.id,
            speaker: foundry.documents.ChatMessage.implementation.getSpeaker(),
            rolls: [rollJSON],
            sound: CONFIG.sounds.dice
        });
    }
}
