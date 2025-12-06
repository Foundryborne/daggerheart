import { refreshIsAllowed } from '../../../helpers/utils.mjs';

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
        classes: ['dh-style'],
        window: {
            title: 'SIDEBAR.TabSettings'
        },
        actions: {
            selectRefreshable: DaggerheartMenu.#selectRefreshable,
            refreshActors: DaggerheartMenu.#refreshActors
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

        return context;
    }

    async getRefreshables(types) {
        const refreshedActors = {};
        for (let actor of game.actors) {
            if (['character', 'adversary'].includes(actor.type) && actor.prototypeToken.actorLink) {
                const updates = {};
                for (let item of actor.items) {
                    if (item.system.metadata?.hasResource && refreshIsAllowed(types, item.system.resource?.recovery)) {
                        if (!refreshedActors[actor.id])
                            refreshedActors[actor.id] = { name: actor.name, img: actor.img, refreshed: new Set() };
                        refreshedActors[actor.id].refreshed.add(
                            game.i18n.localize(CONFIG.DH.GENERAL.refreshTypes[item.system.resource.recovery].label)
                        );

                        if (!updates[item.id]?.system) updates[item.id] = { system: {} };

                        const increasing =
                            item.system.resource.progression === CONFIG.DH.ITEM.itemResourceProgression.increasing.id;
                        updates[item.id].system = {
                            ...updates[item.id].system,
                            'resource.value': increasing
                                ? 0
                                : Roll.replaceFormulaData(item.system.resource.max, actor.getRollData())
                        };
                    }
                    if (item.system.metadata?.hasActions) {
                        const refreshTypes = new Set();
                        const actions = item.system.actions.filter(action => {
                            if (refreshIsAllowed(types, action.uses.recovery)) {
                                refreshTypes.add(action.uses.recovery);
                                return true;
                            }

                            return false;
                        });
                        if (actions.length === 0) continue;

                        if (!refreshedActors[actor.id])
                            refreshedActors[actor.id] = { name: actor.name, img: actor.img, refreshed: new Set() };
                        refreshedActors[actor.id].refreshed.add(
                            ...refreshTypes.map(type => game.i18n.localize(CONFIG.DH.GENERAL.refreshTypes[type].label))
                        );

                        if (!updates[item.id]?.system) updates[item.id] = { system: {} };

                        updates[item.id].system = {
                            ...updates[item.id].system,
                            ...actions.reduce(
                                (acc, action) => {
                                    acc.actions[action.id] = { 'uses.value': 0 };
                                    return acc;
                                },
                                { actions: updates[item.id].system.actions ?? {} }
                            )
                        };
                    }
                }

                for (let key in updates) {
                    const update = updates[key];
                    await actor.items.get(key).update(update);
                }
            }
        }

        return refreshedActors;
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
        await this.getRefreshables(refreshKeys);
        const types = refreshKeys.map(x => this.refreshSelections[x].label).join(', ');
        ui.notifications.info(
            game.i18n.format('DAGGERHEART.UI.Notifications.gmMenuRefresh', {
                types: `[${types}]`
            })
        );
        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();

        const cls = getDocumentClass('ChatMessage');
        const msg = {
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/refreshMessage.hbs',
                {
                    types: types
                }
            ),
            title: game.i18n.localize('DAGGERHEART.UI.Chat.refreshMessage.title'),
            speaker: cls.getSpeaker()
        };

        cls.create(msg);

        this.render();
    }
}
