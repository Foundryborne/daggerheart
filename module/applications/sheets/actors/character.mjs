import DHBaseActorSheet from '../api/base-actor.mjs';
import DhpDeathMove from '../../dialogs/deathMove.mjs';
import { abilities } from '../../../config/actorConfig.mjs';
import DhCharacterlevelUp from '../../levelup/characterLevelup.mjs';
import DhCharacterCreation from '../../characterCreation/characterCreation.mjs';
import FilterMenu from '../../ux/filter-menu.mjs';
import { getDocFromElement, getDocFromElementSync } from '../../../helpers/utils.mjs';
import { ItemBrowser } from '../../ui/itemBrowser.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

const { TextEditor } = foundry.applications.ux;
export default class CharacterSheet extends DHBaseActorSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['character'],
        position: { width: 850, height: 800 },
        actions: {
            toggleVault: CharacterSheet.#toggleVault,
            rollAttribute: CharacterSheet.#rollAttribute,
            toggleHope: CharacterSheet.#toggleHope,
            toggleLoadoutView: CharacterSheet.#toggleLoadoutView,
            openPack: CharacterSheet.#openPack,
            makeDeathMove: CharacterSheet.#makeDeathMove,
            levelManagement: CharacterSheet.#levelManagement,
            toggleEquipItem: CharacterSheet.#toggleEquipItem,
            toggleResourceDice: CharacterSheet.#toggleResourceDice,
            handleResourceDice: CharacterSheet.#handleResourceDice,
            useDowntime: this.useDowntime,
            tempBrowser: CharacterSheet.#tempBrowser
        },
        window: {
            resizable: true
        },
        dragDrop: [
            {
                dragSelector: '[data-item-id][draggable="true"]',
                dropSelector: null
            }
        ],
        contextMenus: [
            {
                handler: CharacterSheet.#getDomainCardContextOptions,
                selector: '[data-item-uuid][data-type="domainCard"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            },
            {
                handler: CharacterSheet.#getEquipamentContextOptions,
                selector: '[data-item-uuid][data-type="armor"], [data-item-uuid][data-type="weapon"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            },
            {
                handler: CharacterSheet.#getItemContextOptions,
                selector: '[data-item-uuid][data-type="consumable"], [data-item-uuid][data-type="loot"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            }
        ]
    };

    /**@override */
    static PARTS = {
        sidebar: {
            id: 'sidebar',
            template: 'systems/daggerheart/templates/sheets/actors/character/sidebar.hbs'
        },
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets/actors/character/header.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets/actors/character/features.hbs'
        },
        loadout: {
            id: 'loadout',
            template: 'systems/daggerheart/templates/sheets/actors/character/loadout.hbs'
        },
        inventory: {
            id: 'inventory',
            template: 'systems/daggerheart/templates/sheets/actors/character/inventory.hbs'
        },
        biography: {
            id: 'biography',
            template: 'systems/daggerheart/templates/sheets/actors/character/biography.hbs'
        },
        effects: {
            id: 'effects',
            template: 'systems/daggerheart/templates/sheets/actors/character/effects.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'loadout' }, { id: 'inventory' }, { id: 'biography' }, { id: 'effects' }],
            initial: 'features',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.inventory-item-resource').forEach(element => {
            element.addEventListener('change', this.updateItemResource.bind(this));
        });
        htmlElement.querySelectorAll('.inventory-item-quantity').forEach(element => {
            element.addEventListener('change', this.updateItemQuantity.bind(this));
        });

        // Add listener for armor marks input
        htmlElement.querySelectorAll('.armor-marks-input').forEach(element => {
            element.addEventListener('change', this.updateArmorMarks.bind(this));
        });
    }

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element
            .querySelector('.level-value')
            ?.addEventListener('change', event => this.document.updateLevel(Number(event.currentTarget.value)));

        this._createFilterMenus();
        this._createSearchFilter();
    }

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.attributes = Object.keys(this.document.system.traits).reduce((acc, key) => {
            acc[key] = {
                ...this.document.system.traits[key],
                name: game.i18n.localize(CONFIG.DH.ACTOR.abilities[key].name),
                verbs: CONFIG.DH.ACTOR.abilities[key].verbs.map(x => game.i18n.localize(x))
            };

            return acc;
        }, {});

        context.inventory = {
            currency: {
                title: game.i18n.localize('DAGGERHEART.CONFIG.Gold.title'),
                coins: game.i18n.localize('DAGGERHEART.CONFIG.Gold.coins'),
                handfuls: game.i18n.localize('DAGGERHEART.CONFIG.Gold.handfuls'),
                bags: game.i18n.localize('DAGGERHEART.CONFIG.Gold.bags'),
                chests: game.i18n.localize('DAGGERHEART.CONFIG.Gold.chests')
            }
        };

        const homebrewCurrency = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).currency;
        if (homebrewCurrency.enabled) {
            context.inventory.currency = homebrewCurrency;
        }

        if (context.inventory.length === 0) {
            context.inventory = Array(1).fill(Array(5).fill([]));
        }

        return context;
    }

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'header':
                const { playerCanEditSheet, levelupAuto } = game.settings.get(
                    CONFIG.DH.id,
                    CONFIG.DH.SETTINGS.gameSettings.Automation
                );
                context.showSettings = game.user.isGM || !levelupAuto || (levelupAuto && playerCanEditSheet);
                break;
            case 'loadout':
                await this._prepareLoadoutContext(context, options);
                break;
            case 'sidebar':
                await this._prepareSidebarContext(context, options);
                break;
            case 'biography':
                await this._prepareBiographyContext(context, options);
                break;
        }

        return context;
    }

    /**
     * Prepare render context for the Loadout part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareLoadoutContext(context, _options) {
        context.cardView = !game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.displayDomainCardsAsList);
    }

    /**
     * Prepare render context for the Sidebar part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareSidebarContext(context, _options) {
        context.isDeath = this.document.system.deathMoveViable;
    }

    /**
     * Prepare render context for the Biography part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareBiographyContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        const paths = {
            background: 'biography.background',
            connections: 'biography.connections'
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
    /*  Context Menu                                */
    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options for DomainCards.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {CharacterSheet}
     * @protected
     */
    static #getDomainCardContextOptions() {
        /**@type {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} */
        const options = [
            {
                name: 'toLoadout',
                icon: 'fa-solid fa-arrow-up',
                condition: target => {
                    const doc = getDocFromElementSync(target);
                    return doc && doc.system.inVault;
                },
                callback: async target => {
                    const doc = await getDocFromElement(target);
                    const actorLoadout = doc.actor.system.loadoutSlot;
                    if (actorLoadout.available) return doc.update({ 'system.inVault': false });
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.loadoutMaxReached'));
                }
            },
            {
                name: 'toVault',
                icon: 'fa-solid fa-arrow-down',
                condition: target => {
                    const doc = getDocFromElementSync(target);
                    return doc && !doc.system.inVault;
                },
                callback: async target => (await getDocFromElement(target)).update({ 'system.inVault': true })
            }
        ].map(option => ({
            ...option,
            name: `DAGGERHEART.APPLICATIONS.ContextMenu.${option.name}`,
            icon: `<i class="${option.icon}"></i>`
        }));

        return [...options, ...this._getContextMenuCommonOptions.call(this, { usable: true, toChat: true })];
    }

    /**
     * Get the set of ContextMenu options for Armors and Weapons.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {CharacterSheet}
     * @protected
     */
    static #getEquipamentContextOptions() {
        const options = [
            {
                name: 'equip',
                icon: 'fa-solid fa-hands',
                condition: target => {
                    const doc = getDocFromElementSync(target);
                    return doc && !doc.system.equipped;
                },
                callback: (target, event) => CharacterSheet.#toggleEquipItem.call(this, event, target)
            },
            {
                name: 'unequip',
                icon: 'fa-solid fa-hands',
                condition: target => {
                    const doc = getDocFromElementSync(target);
                    return doc && doc.system.equipped;
                },
                callback: (target, event) => CharacterSheet.#toggleEquipItem.call(this, event, target)
            }
        ].map(option => ({
            ...option,
            name: `DAGGERHEART.APPLICATIONS.ContextMenu.${option.name}`,
            icon: `<i class="${option.icon}"></i>`
        }));

        return [...options, ...this._getContextMenuCommonOptions.call(this, { usable: true, toChat: true })];
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
            },
            {
                key: 'loadout',
                input: 'input[type="search"].search-loadout',
                content: '[data-application-part="loadout"] .items-section',
                callback: this._onSearchFilterCard.bind(this)
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

    /**
     * Handle card items search and filtering.
     * @param {KeyboardEvent} event  The keyboard input event.
     * @param {string} query         The input search string.
     * @param {RegExp} rgx           The regular expression query that should be matched against.
     * @param {HTMLElement} html     The container to filter items from.
     * @protected
     */
    async _onSearchFilterCard(_event, query, rgx, html) {
        this.#filteredItems.loadout.search.clear();

        for (const li of html.querySelectorAll('.items-list .inventory-item, .card-list .card-item')) {
            const item = await getDocFromElement(li);
            const matchesSearch = !query || foundry.applications.ux.SearchFilter.testQuery(rgx, item.name);
            if (matchesSearch) this.#filteredItems.loadout.search.add(item.id);
            const { menu } = this.#filteredItems.loadout;
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
            },
            {
                key: 'loadout',
                container: '[data-application-part="loadout"]',
                content: '.items-section',
                callback: this._onMenuFilterLoadout.bind(this),
                target: '.filter-button',
                filters: FilterMenu.cardsFilters
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

    /**
     * Callback when filters change
     * @param {PointerEvent} event
     * @param {HTMLElement} html
     * @param {import('../ux/filter-menu.mjs').FilterItem[]} filters
     */
    async _onMenuFilterLoadout(_event, html, filters) {
        this.#filteredItems.loadout.menu.clear();

        for (const li of html.querySelectorAll('.items-list .inventory-item, .card-list .card-item')) {
            const item = await getDocFromElement(li);

            const matchesMenu =
                filters.length === 0 || filters.some(f => foundry.applications.ux.SearchFilter.evaluateFilter(item, f));
            if (matchesMenu) this.#filteredItems.loadout.menu.add(item.id);

            const { search } = this.#filteredItems.loadout;
            li.hidden = !(search.has(item.id) && matchesMenu);
        }
    }

    /* -------------------------------------------- */
    /*  Application Listener Actions                */
    /* -------------------------------------------- */

    async updateItemResource(event) {
        const item = await getDocFromElement(event.currentTarget);
        if (!item) return;

        const max = event.currentTarget.max ? Number(event.currentTarget.max) : null;
        const value = max ? Math.min(Number(event.currentTarget.value), max) : event.currentTarget.value;
        await item.update({ 'system.resource.value': value });
        this.render();
    }

    async updateItemQuantity(event) {
        const item = await getDocFromElement(event.currentTarget);
        if (!item) return;

        await item.update({ 'system.quantity': event.currentTarget.value });
        this.render();
    }

    async updateArmorMarks(event) {
        const armor = this.document.system.armor;
        if (!armor) return;

        const maxMarks = this.document.system.armorScore;
        const value = Math.min(Math.max(Number(event.currentTarget.value), 0), maxMarks);
        await armor.update({ 'system.marks.value': value });
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Opens the character level management window.
     * If the character requires setup, opens the character creation interface.
     * If class or subclass is missing, shows an error notification.
     * @type {ApplicationClickAction}
     */
    static #levelManagement() {
        if (this.document.system.needsCharacterSetup)
            return new DhCharacterCreation(this.document).render({ force: true });

        const { value, subclass } = this.document.system.class;
        if (!value || !subclass)
            return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.missingClassOrSubclass'));

        new DhCharacterlevelUp(this.document).render({ force: true });
    }

    /**
     * Opens the Death Move interface for the character.
     * @type {ApplicationClickAction}
     */
    static async #makeDeathMove() {
        await new DhpDeathMove(this.document).render({ force: true });
    }

    /**
     * Opens a compendium pack given its dataset key.
     * @type {ApplicationClickAction}
     */
    static async #openPack(_event, button) {
        const { key } = button.dataset;

        const presets = {
            compendium: 'daggerheart',
            folder: key,
            render: {
                noFolder: true
            }
        };

        return new ItemBrowser({ presets }).render({ force: true });
    }

    /**
     * Rolls an attribute check based on the clicked button's dataset attribute.
     * @type {ApplicationClickAction}
     */
    static async #rollAttribute(event, button) {
        const abilityLabel = game.i18n.localize(abilities[button.dataset.attribute].label);
        const config = {
            event: event,
            title: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${this.actor.name}`,
            headerTitle: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                ability: abilityLabel
            }),
            roll: {
                trait: button.dataset.attribute
            },
            hasRoll: true
        };
        const result = await this.document.diceRoll({
            ...config,
            headerTitle: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${this.actor.name}`,
            title: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                ability: abilityLabel
            })
        });

        setTimeout(() => {
            this.consumeResource(result?.costs);
        }, 50);
    }

    async consumeResource(costs) {
        if (!costs?.length) return;
        const usefulResources = foundry.utils.deepClone(this.actor.system.resources);
        const resources = game.system.api.fields.ActionFields.CostField.getRealCosts(costs).map(c => {
            const resource = usefulResources[c.key];
            return {
                key: c.key,
                value: (c.total ?? c.value) * (resource.isReversed ? 1 : -1),
                target: resource.target,
                keyIsID: resource.keyIsID
            };
        });

        await this.actor.modifyResource(resources);
    }

    //TODO: redo toggleEquipItem method

    /**
     * Toggles the equipped state of an item (armor or weapon).
     * @type {ApplicationClickAction}
     */
    static async #toggleEquipItem(_event, button) {
        const item = await getDocFromElement(button);
        if (!item) return;
        if (item.system.equipped) {
            await item.update({ 'system.equipped': false });
            return;
        }

        switch (item.type) {
            case 'armor':
                const currentArmor = this.document.system.armor;
                if (currentArmor) {
                    await currentArmor.update({ 'system.equipped': false });
                }

                await item.update({ 'system.equipped': true });
                break;
            case 'weapon':
                if (this.document.effects.find(x => !x.disabled && x.type === 'beastform')) {
                    return ui.notifications.warn(
                        game.i18n.localize('DAGGERHEART.UI.Notifications.beastformEquipWeapon')
                    );
                }

                await this.document.system.constructor.unequipBeforeEquip.bind(this.document.system)(item);

                await item.update({ 'system.equipped': true });
                break;
        }
    }

    /**
     * Toggles the current view of the character's loadout display.
     * @type {ApplicationClickAction}
     */
    static async #toggleLoadoutView(_, button) {
        const newAbilityView = button.dataset.value !== 'true';
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.displayDomainCardsAsList, newAbilityView);
        this.render();
    }

    /**
     * Toggles a hope resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleHope(_, button) {
        const hopeValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.resources.hope.value >= hopeValue ? hopeValue - 1 : hopeValue;
        await this.document.update({ 'system.resources.hope.value': newValue });
    }

    /**
     * Toggles whether an item is stored in the vault.
     * @type {ApplicationClickAction}
     */
    static async #toggleVault(_event, button) {
        const doc = await getDocFromElement(button);
        const { available } = this.document.system.loadoutSlot;
        if (doc.system.inVault && !available) {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.loadoutMaxReached'));
        }

        await doc?.update({ 'system.inVault': !doc.system.inVault });
    }

    /**
     * Toggle the used state of a resource dice.
     * @type {ApplicationClickAction}
     */
    static async #toggleResourceDice(event, target) {
        const item = await getDocFromElement(target);

        const { dice } = event.target.closest('.item-resource').dataset;
        const diceState = item.system.resource.diceStates[dice];

        await item.update({
            [`system.resource.diceStates.${dice}.used`]: diceState ? !diceState.used : true
        });
    }

    /**
     * Temp
     */
    static async #tempBrowser(_, target) {
        new ItemBrowser().render({ force: true });
    }

    /**
     * Handle the roll values of resource dice.
     * @type {ApplicationClickAction}
     */
    static async #handleResourceDice(_, target) {
        const item = await getDocFromElement(target);
        if (!item) return;

        const rollValues = await game.system.api.applications.dialogs.ResourceDiceDialog.create(item, this.document);
        if (!rollValues) return;

        await item.update({
            'system.resource.diceStates': rollValues.reduce((acc, state, index) => {
                acc[index] = { value: state.value, used: state.used };
                return acc;
            }, {})
        });
    }

    /**
     *  Open the downtime application.
     * @type {ApplicationClickAction}
     */
    static useDowntime(_, button) {
        new game.system.api.applications.dialogs.Downtime(this.document, button.dataset.type === 'shortRest').render({
            force: true
        });
    }

    async _onDragStart(event) {
        const item = await getDocFromElement(event.target);

        const dragData = {
            type: item.documentName,
            uuid: item.uuid
        };

        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));

        super._onDragStart(event);
    }

    async _onDrop(event) {
        // Prevent event bubbling to avoid duplicate handling
        event.preventDefault();
        event.stopPropagation();

        super._onDrop(event);
        this._onDropItem(event, TextEditor.getDragEventData(event));
    }

    async _onDropItem(event, data) {
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        if (item.type === 'domainCard' && !this.document.system.loadoutSlot.available) {
            itemData.system.inVault = true;
        }

        if (this.document.uuid === item.parent?.uuid) return this._onSortItem(event, itemData);
        const createdItem = await this._onDropItemCreate(itemData);

        return createdItem;
    }

    async _onDropItemCreate(itemData, event) {
        itemData = itemData instanceof Array ? itemData : [itemData];
        return this.document.createEmbeddedDocuments('Item', itemData);
    }
}
