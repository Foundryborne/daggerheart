import DHBaseActorSheet from '../api/base-actor.mjs';
import DhpDeathMove from '../../dialogs/deathMove.mjs';
import { abilities } from '../../../config/actorConfig.mjs';
import DhCharacterlevelUp from '../../levelup/characterLevelup.mjs';
import DhCharacterCreation from '../../characterCreation/characterCreation.mjs';
import FilterMenu from '../../ux/filter-menu.mjs';
import { itemAbleRollParse } from '../../../helpers/utils.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

const { TextEditor } = foundry.applications.ux;
export default class CharacterSheet extends DHBaseActorSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['character'],
        position: { width: 850, height: 800 },
        actions: {
            triggerContextMenu: CharacterSheet.#triggerContextMenu,
            toggleVault: CharacterSheet.#toggleVault,
            rollAttribute: CharacterSheet.#rollAttribute,
            toggleHope: CharacterSheet.#toggleHope,
            toggleLoadoutView: CharacterSheet.#toggleLoadoutView,
            openPack: CharacterSheet.#openPack,
            makeDeathMove: CharacterSheet.#makeDeathMove,
            levelManagement: CharacterSheet.#levelManagement,
            toggleEquipItem: CharacterSheet.#toggleEquipItem,
            useItem: this.useItem, //TODO Fix this
            useAction: this.useAction,
            toggleResourceDice: this.toggleResourceDice,
            handleResourceDice: this.handleResourceDice,
            toChat: this.toChat,
            useDowntime: this.useDowntime
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
                handler: CharacterSheet._getContextMenuOptions,
                selector: '[data-item-id]',
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

    getItem(element) {
        const listElement = (element.target ?? element).closest('[data-item-id]');
        const itemId = listElement.dataset.itemId;

        switch (listElement.dataset.type) {
            case 'effect':
                return this.document.effects.get(itemId);
            default:
                return this.document.items.get(itemId);
        }
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
                handfulls: game.i18n.localize('DAGGERHEART.CONFIG.Gold.handfulls'),
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
            case 'loadout':
                await this._prepareLoadoutContext(context, options);
                break;
            case 'sidebar':
                await this._prepareSidebarContext(context, options);
                break;
        }
        return context;
    }

    async _prepareLoadoutContext(context, _options) {
        context.listView = game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.displayDomainCardsAsList);
    }

    async _prepareSidebarContext(context, _options) {
        context.isDeath = this.document.system.deathMoveViable;
    }

    /* -------------------------------------------- */
    /*  Context Menu                                */
    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {CharacterSheet}
     * @protected
     */
    static _getContextMenuOptions() {
        /**
         * Get the item from the element.
         * @param {HTMLElement} el
         * @returns {foundry.documents.Item?}
         */
        const getItem = element => {
            const listElement = (element.target ?? element).closest('[data-item-id]');
            const itemId = listElement.dataset.itemId;

            switch (listElement.dataset.type) {
                case 'effect':
                    return this.document.effects.get(itemId);
                default:
                    return this.document.items.get(itemId);
            }
        };

        return [
            {
                name: 'DAGGERHEART.ACTORS.Character.contextMenu.useItem',
                icon: '<i class="fa-solid fa-burst"></i>',
                condition: el => {
                    const item = getItem(el);
                    return !['class', 'subclass'].includes(item.type);
                },
                callback: (button, event) => CharacterSheet.useItem.call(this, event, button)
            },
            {
                name: 'DAGGERHEART.ACTORS.Character.contextMenu.equip',
                icon: '<i class="fa-solid fa-hands"></i>',
                condition: el => {
                    const item = getItem(el);
                    return ['weapon', 'armor'].includes(item.type) && !item.system.equipped;
                },
                callback: CharacterSheet.#toggleEquipItem.bind(this)
            },
            {
                name: 'DAGGERHEART.ACTORS.Character.contextMenu.unequip',
                icon: '<i class="fa-solid fa-hands"></i>',
                condition: el => {
                    const item = getItem(el);
                    return ['weapon', 'armor'].includes(item.type) && item.system.equipped;
                },
                callback: CharacterSheet.#toggleEquipItem.bind(this)
            },
            {
                name: 'DAGGERHEART.ACTORS.Character.contextMenu.toLoadout',
                icon: '<i class="fa-solid fa-arrow-up"></i>',
                condition: el => {
                    const item = getItem(el);
                    return ['domainCard'].includes(item.type) && item.system.inVault;
                },
                callback: target => getItem(target).update({ 'system.inVault': false })
            },
            {
                name: 'DAGGERHEART.ACTORS.Character.contextMenu.toVault',
                icon: '<i class="fa-solid fa-arrow-down"></i>',
                condition: el => {
                    const item = getItem(el);
                    return ['domainCard'].includes(item.type) && !item.system.inVault;
                },
                callback: target => getItem(target).update({ 'system.inVault': true })
            },
            {
                name: 'DAGGERHEART.ACTORS.Character.contextMenu.sendToChat',
                icon: '<i class="fa-regular fa-message"></i>',
                callback: CharacterSheet.toChat.bind(this)
            },
            {
                name: 'CONTROLS.CommonEdit',
                icon: '<i class="fa-solid fa-pen-to-square"></i>',
                callback: target => getItem(target).sheet.render({ force: true })
            },
            {
                name: 'CONTROLS.CommonDelete',
                icon: '<i class="fa-solid fa-trash"></i>',
                callback: async el => {
                    const item = getItem(el);
                    const confirmed = await foundry.applications.api.DialogV2.confirm({
                        window: {
                            title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                                type: game.i18n.localize(`TYPES.${item.documentName}.${item.type}`),
                                name: item.name
                            })
                        },
                        content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', {
                            name: item.name
                        })
                    });
                    if (!confirmed) return;

                    item.delete();
                }
            }
        ];
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
    _onSearchFilterInventory(event, query, rgx, html) {
        this.#filteredItems.inventory.search.clear();

        for (const li of html.querySelectorAll('.inventory-item')) {
            const item = this.document.items.get(li.dataset.itemId);
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
    _onSearchFilterCard(event, query, rgx, html) {
        this.#filteredItems.loadout.search.clear();

        for (const li of html.querySelectorAll('.items-list .inventory-item, .card-list .card-item')) {
            const item = this.document.items.get(li.dataset.itemId);
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
    _onMenuFilterInventory(event, html, filters) {
        this.#filteredItems.inventory.menu.clear();

        for (const li of html.querySelectorAll('.inventory-item')) {
            const item = this.document.items.get(li.dataset.itemId);

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
    _onMenuFilterLoadout(event, html, filters) {
        this.#filteredItems.loadout.menu.clear();

        for (const li of html.querySelectorAll('.items-list .inventory-item, .card-list .card-item')) {
            const item = this.document.items.get(li.dataset.itemId);

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
        const item = this.getItem(event.currentTarget);
        if (!item) return;

        const max = item.system.resource.max ? itemAbleRollParse(item.system.resource.max, this.document, item) : null;
        const value = max ? Math.min(Number(event.currentTarget.value), max) : event.currentTarget.value;
        await item.update({ 'system.resource.value': value });
        this.render();
    }

    async updateItemQuantity(event) {
        const item = this.getItem(event.currentTarget);
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
        this.render();
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
        game.packs.get(key)?.render(true);
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
            }
        };
        this.document.diceRoll(config);
    }

    /**
     * Toggles the equipped state of an item (armor or weapon).
     * @type {ApplicationClickAction}
     */
    static async #toggleEquipItem(_event, button) {
        //TODO: redo this
        const item = this.actor.items.get(button.closest('[data-item-id]')?.dataset.itemId);
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
    static async #toggleVault(event, button) {
        const docId = button.closest('[data-item-id]')?.dataset.itemId;
        const doc = this.document.items.get(docId);
        await doc?.update({ 'system.inVault': !doc.system.inVault });
    }

    /**
     * Trigger the context menu.
     * @type {ApplicationClickAction}
     */
    static #triggerContextMenu(event, _) {
        return CONFIG.ux.ContextMenu.triggerContextMenu(event);
    }

    /**
     * Use a item
     * @type {ApplicationClickAction}
     */
    static async useItem(event, button) {
        const item = this.getItem(button);
        if (!item) return;

        // Should dandle its actions. Or maybe they'll be separate buttons as per an Issue on the board
        if (item.type === 'feature') {
            item.use(event);
        } else if (item instanceof ActiveEffect) {
            item.toChat(this);
        } else {
            item.use(event);
        }
    }

    /**
     * Use an action
     * @type {ApplicationClickAction}
     */
    static async useAction(event, button) {
        const item = this.getItem(button);
        if (!item) return;

        const action = item.system.actions.find(x => x.id === button.dataset.actionId);
        if (!action) return;

        action.use(event);
    }

    /**
     * Toggle the used state of a resource dice.
     * @type {ApplicationClickAction}
     */
    static async toggleResourceDice(event) {
        const target = event.target.closest('.item-resource');
        const item = this.getItem(event);
        if (!item) return;

        const diceState = item.system.resource.diceStates[target.dataset.dice];
        await item.update({
            [`system.resource.diceStates.${target.dataset.dice}.used`]: diceState?.used ? !diceState.used : true
        });
    }

    /**
     * Handle the roll values of resource dice.
     * @type {ApplicationClickAction}
     */
    static async handleResourceDice(event) {
        const item = this.getItem(event);
        if (!item) return;

        const rollValues = await game.system.api.applications.dialogs.ResourceDiceDialog.create(item, this.document);
        if (!rollValues) return;

        await item.update({
            'system.resource.diceStates': rollValues.reduce((acc, state, index) => {
                acc[index] = { value: state.value, used: state.used };
                return acc;
            }, {})
        });
        this.render();
    }

    /**
     * Send item to Chat
     * @type {ApplicationClickAction}
     */
    static async toChat(event, button) {
        if (button?.dataset?.type === 'experience') {
            const experience = this.document.system.experiences[button.dataset.uuid];
            const cls = getDocumentClass('ChatMessage');
            const systemData = {
                name: game.i18n.localize('DAGGERHEART.GENERAL.Experience.single'),
                description: `${experience.name} ${experience.value.signedString()}`
            };
            const msg = new cls({
                type: 'abilityUse',
                user: game.user.id,
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                    systemData
                )
            });

            cls.create(msg.toObject());
        } else {
            const item = this.getItem(event);
            if (!item) return;
            item.toChat(this.document.id);
        }
    }

    static useDowntime(_, button) {
        new game.system.api.applications.dialogs.Downtime(this.document, button.dataset.type === 'shortRest').render(
            true
        );
    }

    async _onDragStart(event) {
        const item = this.getItem(event);

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

        if (item.type === 'domainCard' && this.document.system.domainCards.loadout.length >= 5) {
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
