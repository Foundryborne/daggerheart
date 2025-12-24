import DHBaseActorSheet from '../api/base-actor.mjs';
import { getDocFromElement } from '../../../helpers/utils.mjs';
import { ItemBrowser } from '../../ui/itemBrowser.mjs';
import FilterMenu from '../../ux/filter-menu.mjs';
import DaggerheartMenu from '../../sidebar/tabs/daggerheartMenu.mjs';
import { socketEvent } from '../../../systemRegistration/socket.mjs';
import GroupRollDialog from '../../dialogs/group-roll-dialog.mjs';
import DhpActor from '../../../documents/actor.mjs';
import DHItem from '../../../documents/item.mjs';

export default class Party extends DHBaseActorSheet {
    constructor(options) {
        super(options);

        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();
    }

    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['party'],
        position: {
            width: 550,
            height: 900
        },
        window: {
            resizable: true
        },
        actions: {
            deletePartyMember: Party.#deletePartyMember,
            deleteItem: Party.#deleteItem,
            toggleHope: Party.#toggleHope,
            toggleHitPoints: Party.#toggleHitPoints,
            toggleStress: Party.#toggleStress,
            toggleArmorSlot: Party.#toggleArmorSlot,
            tempBrowser: Party.#tempBrowser,
            refeshActions: Party.#refeshActions,
            triggerRest: Party.#triggerRest,
            tagTeamRoll: Party.#tagTeamRoll,
            groupRoll: Party.#groupRoll,
            selectRefreshable: DaggerheartMenu.selectRefreshable,
            refreshActors: DaggerheartMenu.refreshActors
        },
        dragDrop: [{ dragSelector: '[data-item-id]', dropSelector: null }]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/party/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        partyMembers: { template: 'systems/daggerheart/templates/sheets/actors/party/party-members.hbs' },
        resources: {
            template: 'systems/daggerheart/templates/sheets/actors/party/resources.hbs',
            scrollable: ['']
        },
        /* NOT YET IMPLEMENTED */
        // projects: {
        //     template: 'systems/daggerheart/templates/sheets/actors/party/projects.hbs',
        //     scrollable: ['']
        // },
        inventory: {
            template: 'systems/daggerheart/templates/sheets/actors/party/inventory.hbs',
            scrollable: ['.tab.inventory .items-section']
        },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/party/notes.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [
                { id: 'partyMembers' },
                { id: 'resources' },
                /* NOT YET IMPLEMENTED */
                // { id: 'projects' },
                { id: 'inventory' },
                { id: 'notes' }
            ],
            initial: 'partyMembers',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    static ALLOWED_ACTOR_TYPES = ['character', 'companion', 'adversary'];
    static DICE_ROLL_ACTOR_TYPES = ['character'];

    async _onRender(context, options) {
        await super._onRender(context, options);
        this._createFilterMenus();
        this._createSearchFilter();
    }

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'header':
                await this._prepareHeaderContext(context, options);
                break;
            case 'notes':
                await this._prepareNotesContext(context, options);
                break;
        }
        return context;
    }

    /**
     * Prepare render context for the Header part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareHeaderContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        context.description = await TextEditor.implementation.enrichHTML(system.description, {
            secrets: this.document.isOwner,
            relativeTo: this.document
        });
    }

    /**
     * Prepare render context for the Biography part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareNotesContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        const paths = {
            notes: 'notes'
        };

        for (const [key, path] of Object.entries(paths)) {
            const value = foundry.utils.getProperty(system, path);
            context[key] = {
                field: system.schema.getField(path),
                value,
                enriched: await TextEditor.implementation.enrichHTML(value, {
                    secrets: this.document.isOwner,
                    relativeTo: this.document
                })
            };
        }
    }

    /**
     * Toggles a hope resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleHope(_, target) {
        const hopeValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.hope.value >= hopeValue ? hopeValue - 1 : hopeValue;
        await actor.update({ 'system.resources.hope.value': newValue });
        this.render();
    }

    /**
     * Toggles a hp resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleHitPoints(_, target) {
        const hitPointsValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.hitPoints.value >= hitPointsValue ? hitPointsValue - 1 : hitPointsValue;
        await actor.update({ 'system.resources.hitPoints.value': newValue });
        this.render();
    }

    /**
     * Toggles a stress resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleStress(_, target) {
        const stressValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.stress.value >= stressValue ? stressValue - 1 : stressValue;
        await actor.update({ 'system.resources.stress.value': newValue });
        this.render();
    }

    /**
     * Toggles a armor slot resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleArmorSlot(_, target, element) {
        const armorItem = await foundry.utils.fromUuid(target.dataset.itemUuid);
        const armorValue = Number.parseInt(target.dataset.value);
        const newValue = armorItem.system.marks.value >= armorValue ? armorValue - 1 : armorValue;
        await armorItem.update({ 'system.marks.value': newValue });
        this.render();
    }

    /**
     * Opens Compedium Browser
     */
    static async #tempBrowser(_, target) {
        new ItemBrowser().render({ force: true });
    }

    static async #refeshActions() {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: 'New Section',
                icon: 'fa-solid fa-campground'
            },
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/sidebar/daggerheart-menu/main.hbs',
                {
                    refreshables: DaggerheartMenu.defaultRefreshSelections()
                }
            ),
            classes: ['daggerheart', 'dialog', 'dh-style', 'tab', 'sidebar-tab', 'daggerheartMenu-sidebar']
        });

        if (!confirmed) return;
    }

    static async #triggerRest(_, button) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize(`DAGGERHEART.APPLICATIONS.Downtime.${button.dataset.type}.title`),
                icon: button.dataset.type === 'shortRest' ? 'fa-solid fa-utensils' : 'fa-solid fa-bed'
            },
            content: 'This will trigger a dialog to players make their downtime moves, are you sure?',
            classes: ['daggerheart', 'dialog', 'dh-style']
        });

        if (!confirmed) return;

        this.document.system.partyMembers.forEach(actor => {
            game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.DowntimeTrigger,
                data: {
                    actorId: actor.uuid,
                    downtimeType: button.dataset.type
                }
            });
        });
    }

    static async downtimeMoveQuery({ actorId, downtimeType }) {
        const actor = await foundry.utils.fromUuid(actorId);
        if (!actor || !actor?.isOwner) reject();
        new game.system.api.applications.dialogs.Downtime(actor, downtimeType === 'shortRest').render({
            force: true
        });
    }

    static async #tagTeamRoll() {
        new game.system.api.applications.dialogs.TagTeamDialog(
            this.document.system.partyMembers.filter(x => Party.DICE_ROLL_ACTOR_TYPES.includes(x.type))
        ).render({
            force: true
        });
    }

    static async #groupRoll(_params) {
        new GroupRollDialog(
            this.document.system.partyMembers.filter(x => Party.DICE_ROLL_ACTOR_TYPES.includes(x.type))
        ).render({ force: true });
    }

    /**
     * Get the set of ContextMenu options for Consumable and Loot.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {CharacterSheet}
     * @protected
     */
    static #getItemContextOptions() {
        return this._getContextMenuCommonOptions.call(this, { usable: true, toChat: true });
    }
    /* -------------------------------------------- */
    /*  Filter Tracking                             */
    /* -------------------------------------------- */

    /**
     * The currently active search filter.
     * @type {foundry.applications.ux.SearchFilter}
     */
    #search = {};

    /**
     * The currently active search filter.
     * @type {FilterMenu}
     */
    #menu = {};

    /**
     * Tracks which item IDs are currently displayed, organized by filter type and section.
     * @type {{
     *   inventory: {
     *     search: Set<string>,
     *     menu: Set<string>
     *   },
     *   loadout: {
     *     search: Set<string>,
     *     menu: Set<string>
     *   },
     * }}
     */
    #filteredItems = {
        inventory: {
            search: new Set(),
            menu: new Set()
        },
        loadout: {
            search: new Set(),
            menu: new Set()
        }
    };

    /* -------------------------------------------- */
    /*  Search Inputs                               */
    /* -------------------------------------------- */

    /**
     * Create and initialize search filter instances for the inventory and loadout sections.
     *
     * Sets up two {@link foundry.applications.ux.SearchFilter} instances:
     * - One for the inventory, which filters items in the inventory grid.
     * - One for the loadout, which filters items in the loadout/card grid.
     * @private
     */
    _createSearchFilter() {
        //Filters could be a application option if needed
        const filters = [
            {
                key: 'inventory',
                input: 'input[type="search"].search-inventory',
                content: '[data-application-part="inventory"] .items-section',
                callback: this._onSearchFilterInventory.bind(this)
            }
        ];

        for (const { key, input, content, callback } of filters) {
            const filter = new foundry.applications.ux.SearchFilter({
                inputSelector: input,
                contentSelector: content,
                callback
            });
            filter.bind(this.element);
            this.#search[key] = filter;
        }
    }

    /**
     * Handle invetory items search and filtering.
     * @param {KeyboardEvent} event  The keyboard input event.
     * @param {string} query         The input search string.
     * @param {RegExp} rgx           The regular expression query that should be matched against.
     * @param {HTMLElement} html     The container to filter items from.
     * @protected
     */
    async _onSearchFilterInventory(_event, query, rgx, html) {
        this.#filteredItems.inventory.search.clear();

        for (const li of html.querySelectorAll('.inventory-item')) {
            const item = await getDocFromElement(li);
            const matchesSearch = !query || foundry.applications.ux.SearchFilter.testQuery(rgx, item.name);
            if (matchesSearch) this.#filteredItems.inventory.search.add(item.id);
            const { menu } = this.#filteredItems.inventory;
            li.hidden = !(menu.has(item.id) && matchesSearch);
        }
    }

    /* -------------------------------------------- */
    /*  Filter Menus                                */
    /* -------------------------------------------- */

    _createFilterMenus() {
        //Menus could be a application option if needed
        const menus = [
            {
                key: 'inventory',
                container: '[data-application-part="inventory"]',
                content: '.items-section',
                callback: this._onMenuFilterInventory.bind(this),
                target: '.filter-button',
                filters: FilterMenu.invetoryFilters
            }
        ];

        menus.forEach(m => {
            const container = this.element.querySelector(m.container);
            this.#menu[m.key] = new FilterMenu(container, m.target, m.filters, m.callback, {
                contentSelector: m.content
            });
        });
    }

    /**
     * Callback when filters change
     * @param {PointerEvent} event
     * @param {HTMLElement} html
     * @param {import('../ux/filter-menu.mjs').FilterItem[]} filters
     */
    async _onMenuFilterInventory(_event, html, filters) {
        this.#filteredItems.inventory.menu.clear();

        for (const li of html.querySelectorAll('.inventory-item')) {
            const item = await getDocFromElement(li);

            const matchesMenu =
                filters.length === 0 || filters.some(f => foundry.applications.ux.SearchFilter.evaluateFilter(item, f));
            if (matchesMenu) this.#filteredItems.inventory.menu.add(item.id);

            const { search } = this.#filteredItems.inventory;
            li.hidden = !(search.has(item.id) && matchesMenu);
        }
    }

    /* -------------------------------------------- */

    async _onDropActor(event, document) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (document instanceof DhpActor && Party.ALLOWED_ACTOR_TYPES.includes(document.type)) {
            const currentMembers = this.document.system.partyMembers.map(x => x.uuid);
            if (currentMembers.includes(data.uuid)) {
                return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.duplicateCharacter'));
            }

            await this.document.update({ 'system.partyMembers': [...currentMembers, document.uuid] });
        } else {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.onlyCharactersInPartySheet'));
        }

        return null;
    }

    static async #deletePartyMember(event, target) {
        const doc = await getDocFromElement(target.closest('.inventory-item'));

        if (!event.shiftKey) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize('TYPES.Actor.adversary'),
                        name: doc.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: doc.name })
            });

            if (!confirmed) return;
        }

        const currentMembers = this.document.system.partyMembers.map(x => x.uuid);
        const newMemberdList = currentMembers.filter(uuid => uuid !== doc.uuid);
        await this.document.update({ 'system.partyMembers': newMemberdList });
    }

    static async #deleteItem(event, target) {
        const doc = await getDocFromElement(target.closest('.inventory-item'));
        if (!event.shiftKey) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize('TYPES.Actor.party'),
                        name: doc.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: doc.name })
            });

            if (!confirmed) return;
        }

        this.document.deleteEmbeddedDocuments('Item', [doc.id]);
    }
}
