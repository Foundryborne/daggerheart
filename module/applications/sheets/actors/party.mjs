import DHBaseActorSheet from '../api/base-actor.mjs';
import { getDocFromElement, sortBy } from '../../../helpers/utils.mjs';
import { ItemBrowser } from '../../ui/itemBrowser.mjs';
import FilterMenu from '../../ux/filter-menu.mjs';
import DaggerheartMenu from '../../sidebar/tabs/daggerheartMenu.mjs';
import { socketEvent } from '../../../systemRegistration/socket.mjs';
import DhpActor from '../../../documents/actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class PartySheet extends DHBaseActorSheet {
    constructor(options) {
        super(options);

        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();
    }

    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['party'],
        position: {
            width: 600,
            height: 900
        },
        window: {
            resizable: true
        },
        actions: {
            openDocument: PartySheet.#onOpenDocument,
            deletePartyMember: PartySheet.#onDeletePartyMember,
            toggleHope: PartySheet.#onToggleHope,
            toggleHitPoints: PartySheet.#onToggleHitPoints,
            toggleStress: PartySheet.#onToggleStress,
            toggleArmorSlot: PartySheet.#onToggleArmorSlot,
            tempBrowser: PartySheet.#onTempBrowser,
            refreshActions: PartySheet.#onRefreshActions,
            triggerRest: PartySheet.#onTriggerRest,
            tagTeamRoll: PartySheet.#onTagTeamRoll,
            groupRoll: PartySheet.#onGroupRoll
        },
        dragDrop: [{ dragSelector: '[data-item-id]', dropSelector: null }]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/party/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        partyMembers: {
            template: 'systems/daggerheart/templates/sheets/actors/party/party-members.hbs',
            scrollable: ['']
        },
        inventory: {
            template: 'systems/daggerheart/templates/sheets/actors/party/inventory.hbs',
            scrollable: ['.tab.inventory .items-section']
        },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/party/notes.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'partyMembers' }, { id: 'inventory' }, { id: 'notes' }],
            initial: 'partyMembers',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    static ALLOWED_ACTOR_TYPES = ['character', 'companion', 'adversary', 'npc'];
    static DICE_ROLL_ACTOR_TYPES = ['character'];

    async _onRender(context, options) {
        await super._onRender(context, options);
        this._createFilterMenus();
        this._createSearchFilter();
    }

    /** @inheritdoc */
    _toggleDisabled(disabled) {
        // Overriden to only disable text inputs by default if the user is a member
        const isMember = this.actor.system.partyMembers.some(
            m => m.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        );
        if (!isMember) return super._toggleDisabled(disabled);

        const form = this.form;
        for (const input of form.querySelectorAll('input:not([type=search]), .editor.prosemirror')) {
            input.disabled = disabled;
        }
        for (const element of form.querySelectorAll('.input[contenteditable]')) {
            element.classList.toggle('disabled', disabled);
        }
    }

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming);
        context.showStats =
            settings.hidePartyStats === 'never' || (settings.hidePartyStats === 'players' && game.user.isGM);
        return context;
    }

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'header':
                await this._prepareHeaderContext(context, options);
                break;
            case 'partyMembers':
                await this._prepareMembersContext(context, options);
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
        context.tagTeamActive = Boolean(this.document.system.tagTeam.initiator);
        context.groupRollActive = Boolean(this.document.system.groupRoll.leader);
    }

    async _prepareMembersContext(context, _options) {
        context.partyMembers = [];
        const traits = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];
        for (const actor of this.document.system.partyMembers) {
            const weapons = [];
            if (actor.type === 'character') {
                if (actor.system.usedUnarmed) {
                    weapons.push(actor.system.usedUnarmed);
                }
                const equipped = actor.items.filter(i => i.system.equipped && i.type === 'weapon');
                weapons.push(...sortBy(equipped, i => (i.system.secondary ? 1 : 0)));
            }

            context.partyMembers.push({
                uuid: actor.uuid,
                img: actor.img,
                name: actor.name,
                subtitle: (() => {
                    if (!['character', 'companion'].includes(actor.type)) {
                        return game.i18n.format(`TYPES.Actor.${actor.type}`);
                    }

                    const { value: classItem, subclass } = actor.system.class ?? {};
                    const partner = actor.system.partner;
                    const ancestry = actor.system.ancestry;
                    const community = actor.system.community;
                    if (partner || (classItem && subclass && ancestry && community)) {
                        return game.i18n.format(`DAGGERHEART.ACTORS.Party.Subtitle.${actor.type}`, {
                            class: classItem?.name,
                            subclass: subclass?.name,
                            partner: partner?.name,
                            ancestry: ancestry?.name,
                            community: community?.name
                        });
                    }
                })(),
                type: actor.type,
                resources: actor.system.resources,
                armorScore: actor.system.armorScore,
                damageThresholds: actor.system.damageThresholds,
                evasion: actor.system.evasion,
                difficulty: actor.system.difficulty,
                traits: actor.system.traits
                    ? traits.map(t => ({
                        label: game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${t}.short`),
                        value: actor.system.traits[t].value
                    }))
                    : null,
                weapons
            });
        }
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
    
    /* -------------------------------------------- */
    /*  Event handlers                          */
    /* -------------------------------------------- */

    /**
     * @this PartySheet 
     * @type {ApplicationClickAction}
     */
    static async #onOpenDocument(_, target) {
        const uuid = target.dataset.uuid;
        const document = await foundry.utils.fromUuid(uuid);
        document?.sheet?.render(true);
    }

    /**
     * Toggles a hope resource value.
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onToggleHope(_, target) {
        const hopeValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.hope.value >= hopeValue ? hopeValue - 1 : hopeValue;
        await actor.update({ 'system.resources.hope.value': newValue });
        this.render();
    }

    /**
     * Toggles a hp resource value.
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onToggleHitPoints(_, target) {
        const hitPointsValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.hitPoints.value >= hitPointsValue ? hitPointsValue - 1 : hitPointsValue;
        await actor.update({ 'system.resources.hitPoints.value': newValue });
        this.render();
    }

    /**
     * Toggles a stress resource value.
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onToggleStress(_, target) {
        const stressValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.stress.value >= stressValue ? stressValue - 1 : stressValue;
        await actor.update({ 'system.resources.stress.value': newValue });
        this.render();
    }

    /**
     * Toggles a armor slot resource value.
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onToggleArmorSlot(_, target) {
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const { value, max } = actor.system.armorScore;
        const inputValue = Number.parseInt(target.dataset.value);
        const newValue = value >= inputValue ? inputValue - 1 : inputValue;
        const changeValue = Math.min(newValue - value, max - value);

        await actor.system.updateArmorValue({ value: changeValue });
        this.render();
    }

    /**
     * Opens Compedium Browser
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onTempBrowser(_, target) {
        new ItemBrowser().render({ force: true });
    }

    /** 
     * @todo Is this unused?
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onRefreshActions() {
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

    /** 
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onTriggerRest(_, button) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize(`DAGGERHEART.APPLICATIONS.Downtime.${button.dataset.type}.title`),
                icon: button.dataset.type === 'shortRest' ? 'fa-solid fa-utensils' : 'fa-solid fa-bed'
            },
            content: game.i18n.localize('DAGGERHEART.ACTORS.Party.triggerRestContent'),
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

    /** 
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onDeletePartyMember(event, target) {
        const doc = await foundry.utils.fromUuid(target.closest('[data-uuid]')?.dataset.uuid);
        if (!event.shiftKey) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.ACTORS.Party.RemoveConfirmation.title', {
                        name: doc.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.ACTORS.Party.RemoveConfirmation.text', { name: doc.name })
            });

            if (!confirmed) return;
        }

        const currentMembers = this.document.system.partyMembers.map(x => x.uuid);
        const newMembersList = currentMembers.filter(uuid => uuid !== doc.uuid);
        await this.document.update({ 'system.partyMembers': newMembersList });
    }

    static async downtimeMoveQuery({ actorId, downtimeType }) {
        const actor = await foundry.utils.fromUuid(actorId);
        if (!actor || !actor?.isOwner) return;
        new game.system.api.applications.dialogs.Downtime(actor, downtimeType === 'shortRest').render({
            force: true
        });
    }

    /** 
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onTagTeamRoll() {
        new game.system.api.applications.dialogs.TagTeamDialog(this.document).render({ force: true });
    }

    /** 
     * @this PartySheet
     * @type {ApplicationClickAction}
     */
    static async #onGroupRoll(_params) {
        new game.system.api.applications.dialogs.GroupRollDialog(this.document).render({ force: true });
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

    /** @inheritdoc */
    async _onDropActor(event, document) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (document instanceof DhpActor && PartySheet.ALLOWED_ACTOR_TYPES.includes(document.type)) {
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
}
