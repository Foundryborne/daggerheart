import DHBaseActorSheet from '../api/base-actor.mjs';
import DhpDeathMove from '../../dialogs/deathMove.mjs';
import DhpDowntime from '../../dialogs/downtime.mjs';
import { abilities } from '../../../config/actorConfig.mjs';
import DhCharacterlevelUp from '../../levelup/characterLevelup.mjs';
import DhCharacterCreation from '../../characterCreation/characterCreation.mjs';
import FilterMenu from '../../ux/filter-menu.mjs';
import DHActionConfig from '../../sheets-configs/action-config.mjs';

const { TextEditor } = foundry.applications.ux;
export default class CharacterSheet extends DHBaseActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['character'],
        position: { width: 850, height: 800 },
        actions: {
            triggerContextMenu: CharacterSheet.#triggerContextMenu,
            attributeRoll: this.rollAttribute,
            toggleMarks: this.toggleMarks,
            toggleHP: this.toggleHP,
            toggleStress: this.toggleStress,
            toggleHope: this.toggleHope,
            toggleGold: this.toggleGold,
            toggleLoadoutView: this.toggleLoadoutView,
            attackRoll: this.attackRoll,
            useDomainCard: this.useDomainCard,
            selectClass: this.selectClass,
            selectSubclass: this.selectSubclass,
            selectCommunity: this.selectCommunity,
            viewObject: this.viewObject,
            useItem: this.useItem,
            useFeature: this.useFeature,
            takeShortRest: this.takeShortRest,
            takeLongRest: this.takeLongRest,
            deleteScar: this.deleteScar,
            makeDeathMove: this.makeDeathMove,
            itemQuantityDecrease: (_, button) => this.setItemQuantity(button, -1),
            itemQuantityIncrease: (_, button) => this.setItemQuantity(button, 1),
            toChat: this.toChat,
            useAdvancementCard: this.useAdvancementCard,
            useAdvancementAbility: this.useAdvancementAbility,
            toggleEquipItem: this.toggleEquipItem,
            toggleVault: this.toggleVault,
            levelManagement: this.levelManagement,
            editImage: this._onEditImage,
        },
        window: {
            resizable: true
        },
        dragDrop: [],
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


    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'loadout' }, { id: 'inventory' }, { id: 'biography' }, { id: 'effects' }],
            initial: 'features',
            labelPrefix: 'DAGGERHEART.General.Tabs'
        }
    };

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element.querySelector('.level-value')?.addEventListener('change', this.onLevelChange.bind(this));

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

    static _onEditImage() {
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current: this.document.img,
            type: 'image',
            redirectToRoot: ['icons/svg/mystery-man.svg'],
            callback: async path => this._updateImage.bind(this)(path),
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

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

    /* -------------------------------------------- */
    /*  Context Menu                                */
    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]}   The Array of context options passed to the ContextMenu instance
     * @protected
     */
    static _getContextMenuOptions() {

        /**
         * Get the item from the element.
         * @param {HTMLElement} el
         * @returns {foundry.documents.Item?}
         */
        const getItem = (el) => this.actor.items.get(el.closest('[data-item-id]')?.dataset.itemId);

        return [{
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.UseItem',
            icon: '<i class="fa-solid fa-burst"></i>',
            condition: el => {
                const item = getItem(el);
                return !['class', 'subclass'].includes(item.type);
            },
            callback: (button, event) => CharacterSheet.useItem.call(this, event, button)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.Equip',
            icon: '<i class="fa-solid fa-hands"></i>',
            condition: el => {
                const item = getItem(el);
                return ['weapon', 'armor'].includes(item.type) && !item.system.equipped;
            },
            callback: CharacterSheet.toggleEquipItem.bind(this)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.Unequip',
            icon: '<i class="fa-solid fa-hands"></i>',
            condition: el => {
                const item = getItem(el);
                return ['weapon', 'armor'].includes(item.type) && item.system.equipped;
            },
            callback: CharacterSheet.toggleEquipItem.bind(this)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.ToLoadout',
            icon: '<i class="fa-solid fa-arrow-up"></i>',
            condition: (el) => {
                const item = getItem(el);
                return ['domainCard'].includes(item.type) && item.system.inVault;
            },
            callback: CharacterSheet.toggleVault.bind(this)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.ToVault',
            icon: '<i class="fa-solid fa-arrow-down"></i>',
            condition: el => {
                const item = getItem(el);
                return ['domainCard'].includes(item.type) && !item.system.inVault;
            },
            callback: CharacterSheet.toggleVault.bind(this)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.SendToChat',
            icon: '<i class="fa-regular fa-message"></i>',
            callback: CharacterSheet.toChat.bind(this)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.Edit',
            icon: '<i class="fa-solid fa-pen-to-square"></i>',
            callback: CharacterSheet.viewObject.bind(this)
        }, {
            name: 'DAGGERHEART.Sheets.PC.ContextMenu.Delete',
            icon: '<i class="fa-solid fa-trash"></i>',
            callback: (el) => getItem(el).delete()
        }];
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

    static async rollAttribute(event, button) {
        const abilityLabel = game.i18n.localize(abilities[button.dataset.attribute].label);
        const config = {
            event: event,
            title: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${this.actor.name}`,
            headerTitle: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilitychecktitle', {
                ability: abilityLabel
            }),
            roll: {
                trait: button.dataset.attribute
            }
        };
        this.document.diceRoll(config);
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

    async mapFeatureType(data, configType) {
        return await Promise.all(
            data.map(async x => {
                const abilities = x.system.abilities
                    ? await Promise.all(x.system.abilities.map(async x => await fromUuid(x.uuid)))
                    : [];

                return {
                    ...x,
                    uuid: x.uuid,
                    system: {
                        ...x.system,
                        abilities: abilities,
                        type: game.i18n.localize(configType[x.system.type ?? x.type].label)
                    }
                };
            })
        );
    }

    static async rollAttribute(event, button) {
        const abilityLabel = game.i18n.localize(abilities[button.dataset.attribute].label);
        const config = {
            event: event,
            title: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilitychecktitle', { ability: abilityLabel }),
            roll: {
                trait: button.dataset.attribute
            }
        };
        this.document.diceRoll(config);
    }

    static async toggleMarks(_, button) {
        const markValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.armor.system.marks.value >= markValue ? markValue - 1 : markValue;
        await this.document.system.armor.update({ 'system.marks.value': newValue });
    }

    static async toggleHP(_, button) {
        const healthValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.resources.hitPoints.value >= healthValue ? healthValue - 1 : healthValue;
        await this.document.update({ 'system.resources.hitPoints.value': newValue });
    }

    static async toggleStress(_, button) {
        const healthValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.resources.stress.value >= healthValue ? healthValue - 1 : healthValue;
        await this.document.update({ 'system.resources.stress.value': newValue });
    }

    static async toggleHope(_, button) {
        const hopeValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.resources.hope.value >= hopeValue ? hopeValue - 1 : hopeValue;
        await this.document.update({ 'system.resources.hope.value': newValue });
    }

    static async toggleGold(_, button) {
        const goldValue = Number.parseInt(button.dataset.value);
        const goldType = button.dataset.type;
        const newValue = this.document.system.gold[goldType] >= goldValue ? goldValue - 1 : goldValue;

        const update = `system.gold.${goldType}`;
        await this.document.update({ [update]: newValue });
    }

    static async toggleLoadoutView(_, button) {
        const newAbilityView = !(button.dataset.value === 'true');
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.displayDomainCardsAsList, newAbilityView);
        this.render();
    }

    static async toggleLoadoutView(_, button) {
        const newAbilityView = !(button.dataset.value === 'true');
        await game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.displayDomainCardsAsList, newAbilityView);
        this.render();
    }

    static async attackRoll(event, button) {
        const weapon = await fromUuid(button.dataset.weapon);
        if (!weapon) return;

        const wasUsed = await weapon.use(event);
        if (wasUsed) {
            Hooks.callAll(CONFIG.DH.HOOKS.characterAttack, {});
        }
    }

    static levelManagement() {
        if (this.document.system.needsCharacterSetup) {
            this.characterSetup();
        } else {
            this.openLevelUp();
        }
    }

    characterSetup() {
        new DhCharacterCreation(this.document).render(true);
    }

    openLevelUp() {
        if (!this.document.system.class.value || !this.document.system.class.subclass) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.missingClassOrSubclass'));
            return;
        }

        new DhCharacterlevelUp(this.document).render(true);
    }

    static async useDomainCard(event, button) {
        const card = this.getItem(event);
        if (!card) return;

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: `${game.i18n.localize('DAGGERHEART.UI.Chat.domainCard.title')} - ${capitalize(button.dataset.domain)}`,
            origin: this.document.id,
            img: card.img,
            name: card.name,
            description: card.system.effect,
            actions: card.system.actions
        };
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            ),
            system: systemData
        });

        cls.create(msg.toObject());
    }

    static async selectClass() {
        (await game.packs.get('daggerheart.classes'))?.render(true);
    }

    static async selectSubclass() {
        (await game.packs.get('daggerheart.subclasses'))?.render(true);
    }

    static async selectCommunity() {
        (await game.packs.get('daggerheart.communities'))?.render(true);
    }

    static async useItem(event, button) {
        const item = this.getItem(button);
        if (!item) return;

        // Should dandle its actions. Or maybe they'll be separate buttons as per an Issue on the board
        if (item.type === 'feature') {
            item.use(event);
        } else if (item instanceof ActiveEffect) {
            item.toChat(this);
        } else {
            const wasUsed = await item.use(event);
            if (wasUsed && item.type === 'weapon') {
                Hooks.callAll(CONFIG.DH.HOOKS.characterAttack, {});
            }
        }
    }

    static async viewObject(event) {
        const item = this.getItem(event);
        if (!item) return;

        if (item.sheet) {
            item.sheet.render(true);
        } else {
            await new DHActionConfig(item).render(true);
        }
    }

    editItem(event) {
        const item = this.getItem(event);
        if (!item) return;

        if (item.sheet.editMode) item.sheet.editMode = false;

        item.sheet.render(true);
    }

    static async takeShortRest() {
        await new DhpDowntime(this.document, true).render(true);
        await this.minimize();
    }

    static async takeLongRest() {
        await new DhpDowntime(this.document, false).render(true);
        await this.minimize();
    }

    static async deleteScar(event, button) {
        event.stopPropagation();
        await this.document.update({
            'system.story.scars': this.document.system.story.scars.filter(
                (_, index) => index !== Number.parseInt(button.currentTarget.dataset.scar)
            )
        });
    }

    static async makeDeathMove() {
        if (this.document.system.resources.hitPoints.value >= this.document.system.resources.hitPoints.maxTotal) {
            await new DhpDeathMove(this.document).render(true);
        }
    }

    async onLevelChange(event) {
        await this.document.updateLevel(Number(event.currentTarget.value));
        this.render();
    }

    static async setItemQuantity(button, value) {
        const item = this.getItem(button);
        if (!item) return;
        await item.update({ 'system.quantity': Math.max(item.system.quantity + value, 1) });
    }

    static async useFeature(event, button) {
        const item = this.getItem(event);
        if (!item) return;

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.UI.Chat.featureTitle'),
            origin: this.document.id,
            img: item.img,
            name: item.name,
            description: item.system.description,
            actions: item.system.actions
        };
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            ),
            system: systemData
        });

        cls.create(msg.toObject());
    }

    static async toChat(event, button) {
        if (button?.dataset?.type === 'experience') {
            const experience = this.document.system.experiences[button.dataset.uuid];
            const cls = getDocumentClass('ChatMessage');
            const systemData = {
                name: game.i18n.localize('DAGGERHEART.GENERAL.Experience.single'),
                description: `${experience.name} ${experience.total < 0 ? experience.total : `+${experience.total}`}`
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

    static async useAdvancementCard(_, button) {
        const item =
            button.dataset.multiclass === 'true'
                ? this.document.system.multiclass.subclass
                : this.document.system.class.subclass;
        const ability = item.system[`${button.dataset.key}Feature`];
        const title = `${item.name} - ${game.i18n.localize(
            `DAGGERHEART.ITEMS.DomainCard.${button.dataset.key.capitalize()}Title`
        )}`;

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.UI.Chat.foundationCard.subclassFeatureTitle'),
            origin: this.document.id,
            name: title,
            img: item.img,
            description: ability.description
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
    }

    static async useAdvancementAbility(_, button) {
        const item = this.document.items.find(x => x.uuid === button.dataset.id);

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.UI.Chat.foundationCard.subclassFeatureTitle'),
            origin: this.document.id,
            name: item.name,
            img: item.img,
            description: item.system.description
        };
        const msg = new cls({
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            )
        });

        cls.create(msg.toObject());
    }

    static async toggleEquipItem(event, button) {
        const item = this.getItem(event);
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
        this.render();
    }

    static async toggleVault(event, button) {
        const item = this.getItem(event);
        if (!item) return;
        await item.update({ 'system.inVault': !item.system.inVault });
    }

    async _onDragStart(_, event) {
        super._onDragStart(event);
    }

    async _onDrop(event) {
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

    /**
     * Trigger the context menu.
     * @param {PointerEvent} event - 
     * @param {HTMLElement} _ -
     * @returns 
     */
    static #triggerContextMenu(event, _) {
        return CONFIG.ux.ContextMenu.triggerContextMenu(event);
    }
}
