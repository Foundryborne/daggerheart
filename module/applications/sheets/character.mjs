import { capitalize } from '../../helpers/utils.mjs';
import DhpDeathMove from '../deathMove.mjs';
import DhpDowntime from '../downtime.mjs';
import AncestrySelectionDialog from '../ancestrySelectionDialog.mjs';
import DaggerheartSheet from './daggerheart-sheet.mjs';
import { abilities } from '../../config/actorConfig.mjs';
import DhlevelUp from '../levelup.mjs';
import DhCharacterCreation from '../characterCreation.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;
export default class CharacterSheet extends DaggerheartSheet(ActorSheetV2) {
    constructor(options = {}) {
        super(options);
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'daggerheart', 'character'],
        position: { width: 850, height: 800 },
        actions: {
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
            selectAncestry: this.selectAncestry,
            selectCommunity: this.selectCommunity,
            viewObject: this.viewObject,
            useItem: this.useItem,
            useFeature: this.useFeature,
            takeShortRest: this.takeShortRest,
            takeLongRest: this.takeLongRest,
            deleteItem: this.deleteItem,
            addScar: this.addScar,
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
            triggerContextMenu: this.triggerContextMenu
        },
        window: {
            resizable: true
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: []
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

    static TABS = {
        features: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'features',
            icon: null,
            label: 'DAGGERHEART.Sheets.PC.Tabs.Features'
        },
        loadout: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'loadout',
            icon: null,
            label: 'DAGGERHEART.Sheets.PC.Tabs.Loadout'
        },
        inventory: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'inventory',
            icon: null,
            label: 'DAGGERHEART.Sheets.PC.Tabs.Inventory'
        },
        biography: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'biography',
            icon: null,
            label: 'DAGGERHEART.Sheets.PC.Tabs.biography'
        },
        effects: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'effects',
            icon: null,
            label: 'DAGGERHEART.Sheets.PC.Tabs.effects'
        }
    };

    _getTabs() {
        const setActive = tabs => {
            for (const v of Object.values(tabs)) {
                v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
                v.cssClass = v.active ? 'active' : '';
            }
        };

        const primaryTabs = {
            features: {
                active: true,
                cssClass: '',
                group: 'primary',
                id: 'features',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Features')
            },
            loadout: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'loadout',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Loadout')
            },
            inventory: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'inventory',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Inventory')
            },
            story: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'story',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Story')
            }
        };
        const secondaryTabs = {
            foundation: {
                active: true,
                cssClass: '',
                group: 'secondary',
                id: 'foundation',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Foundation')
            },
            loadout: {
                active: false,
                cssClass: '',
                group: 'secondary',
                id: 'loadout',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Loadout')
            },
            vault: {
                active: false,
                cssClass: '',
                group: 'secondary',
                id: 'vault',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.PC.Tabs.Vault')
            }
        };

        setActive(primaryTabs);
        setActive(secondaryTabs);

        return { primary: primaryTabs, secondary: secondaryTabs };
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);

        this._createContextMenues();
    }

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this._createSearchFilter();
    }

    /* -------------------------------------------- */

    _createContextMenues() {
        const allOptions = {
            useItem: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.UseItem',
                icon: '<i class="fa-solid fa-burst"></i>',
                condition: el => {
                    const item = this.getItem(el);
                    return !['class', 'subclass'].includes(item.type);
                },
                callback: (button, event) => this.constructor.useItem.bind(this)(event, button)
            },
            equip: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.Equip',
                icon: '<i class="fa-solid fa-hands"></i>',
                condition: el => {
                    const item = this.getItem(el);
                    return ['weapon', 'armor'].includes(item.type) && !item.system.equipped;
                },
                callback: this.constructor.toggleEquipItem.bind(this)
            },
            unequip: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.Unequip',
                icon: '<i class="fa-solid fa-hands"></i>',
                condition: el => {
                    const item = this.getItem(el);
                    return ['weapon', 'armor'].includes(item.type) && item.system.equipped;
                },
                callback: this.constructor.toggleEquipItem.bind(this)
            },
            sendToLoadout: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.ToLoadout',
                icon: '<i class="fa-solid fa-arrow-up"></i>',
                condition: el => {
                    const item = this.getItem(el);
                    return ['domainCard'].includes(item.type) && item.system.inVault;
                },
                callback: this.constructor.toggleVault.bind(this)
            },
            sendToVault: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.ToVault',
                icon: '<i class="fa-solid fa-arrow-down"></i>',
                condition: el => {
                    const item = this.getItem(el);
                    return ['domainCard'].includes(item.type) && !item.system.inVault;
                },
                callback: this.constructor.toggleVault.bind(this)
            },
            sendToChat: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.SendToChat',
                icon: '<i class="fa-regular fa-message"></i>',
                callback: this.constructor.toChat.bind(this)
            },
            edit: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.Edit',
                icon: '<i class="fa-solid fa-pen-to-square"></i>',
                callback: this.constructor.viewObject.bind(this)
            },
            delete: {
                name: 'DAGGERHEART.Sheets.PC.ContextMenu.Delete',
                icon: '<i class="fa-solid fa-trash"></i>',
                callback: this.constructor.deleteItem.bind(this)
            }
        };

        this._createContextMenu(() => Object.values(allOptions), `[data-item-id]`, {
            parentClassHooks: false,
            fixed: true
        });
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelector('.level-value')?.addEventListener('change', this.onLevelChange.bind(this));
    }

    getItem(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.items.get(itemId);
        return item;
    }

    static triggerContextMenu(event, button) {
        return CONFIG.ux.ContextMenu.triggerContextMenu(event);
    }

    static _onEditImage() {
        const fp = new FilePicker({
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
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);

        context.config = SYSTEM;

        const selectedAttributes = Object.values(this.document.system.traits).map(x => x.base);
        context.abilityScoreArray = await game.settings
            .get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew)
            .traitArray.reduce((acc, x) => {
                const selectedIndex = selectedAttributes.indexOf(x);
                if (selectedIndex !== -1) {
                    selectedAttributes.splice(selectedIndex, 1);
                } else {
                    acc.push({ name: x, value: x });
                }

                return acc;
            }, []);
        if (!context.abilityScoreArray.includes(0)) context.abilityScoreArray.push({ name: 0, value: 0 });
        context.abilityScoresFinished = context.abilityScoreArray.every(x => x.value === 0);

        context.attributes = Object.keys(this.document.system.traits).reduce((acc, key) => {
            acc[key] = {
                ...this.document.system.traits[key],
                name: game.i18n.localize(SYSTEM.ACTOR.abilities[key].name),
                verbs: SYSTEM.ACTOR.abilities[key].verbs.map(x => game.i18n.localize(x))
            };

            return acc;
        }, {});

        const ancestry = await this.mapFeatureType(
            this.document.system.ancestry ? [this.document.system.ancestry] : [],
            SYSTEM.GENERAL.objectTypes
        );
        const community = await this.mapFeatureType(
            this.document.system.community ? [this.document.system.community] : [],
            SYSTEM.GENERAL.objectTypes
        );
        const foundation = {
            ancestry: ancestry[0],
            community: community[0],
            advancement: {}
        };

        const nrLoadoutCards = this.document.system.domainCards.loadout.length;
        const loadout = await this.mapFeatureType(this.document.system.domainCards.loadout, SYSTEM.DOMAIN.cardTypes);
        const vault = await this.mapFeatureType(this.document.system.domainCards.vault, SYSTEM.DOMAIN.cardTypes);
        context.abilities = {
            foundation: foundation,
            loadout: {
                top: loadout.slice(0, Math.min(2, nrLoadoutCards)),
                bottom: nrLoadoutCards > 2 ? loadout.slice(2, Math.min(5, nrLoadoutCards)) : [],
                nrTotal: nrLoadoutCards,
                listView: game.user.getFlag(SYSTEM.id, SYSTEM.FLAGS.displayDomainCardsAsList)
            },
            vault: vault.map(x => ({
                ...x,
                uuid: x.uuid,
                sendToLoadoutDisabled: this.document.system.domainCards.loadout.length >= 5
            }))
        };

        context.inventory = {
            consumable: {
                titles: {
                    name: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.ConsumableTitle'),
                    quantity: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.QuantityTitle')
                },
                items: this.document.items.filter(x => x.type === 'consumable')
            },
            miscellaneous: {
                titles: {
                    name: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.MiscellaneousTitle'),
                    quantity: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.QuantityTitle')
                },
                items: this.document.items.filter(x => x.type === 'miscellaneous')
            },
            weapons: {
                titles: {
                    name: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.WeaponsTitle'),
                    quantity: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.QuantityTitle')
                },
                items: this.document.items.filter(x => x.type === 'weapon')
            },
            armor: {
                titles: {
                    name: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.ArmorsTitle'),
                    quantity: game.i18n.localize('DAGGERHEART.Sheets.PC.InventoryTab.QuantityTitle')
                },
                items: this.document.items.filter(x => x.type === 'armor')
            },
            currency: {
                title: game.i18n.localize('DAGGERHEART.Sheets.PC.Gold.Title'),
                coins: game.i18n.localize('DAGGERHEART.Sheets.PC.Gold.Coins'),
                handfulls: game.i18n.localize('DAGGERHEART.Sheets.PC.Gold.Handfulls'),
                bags: game.i18n.localize('DAGGERHEART.Sheets.PC.Gold.Bags'),
                chests: game.i18n.localize('DAGGERHEART.Sheets.PC.Gold.Chests')
            }
        };

        const homebrewCurrency = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew).currency;
        if (homebrewCurrency.enabled) {
            context.inventory.currency = homebrewCurrency;
        }

        if (context.inventory.length === 0) {
            context.inventory = Array(1).fill(Array(5).fill([]));
        }

        return context;
    }

    /* -------------------------------------------- */
    /*  Search Filter                               */
    /* -------------------------------------------- */

    /**
     * The currently active search filter.
     * @type {foundry.applications.ux.SearchFilter}
     */
    #search = {};

    /**
     * Track which item IDs are currently displayed due to a search filter.
     * @type {{ inventory: Set<string>, loadout: Set<string> }}
     */
    #filteredItems = {
        inventory: new Set(),
        loadout: new Set()
    };

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
        this.#filteredItems.inventory.clear();

        for (const ul of html.querySelectorAll('.items-list')) {
            for (const li of ul.querySelectorAll('.inventory-item')) {
                const item = this.document.items.get(li.dataset.itemId);
                const match = !query || foundry.applications.ux.SearchFilter.testQuery(rgx, item.name);
                if (match) this.#filteredItems.inventory.add(item.id);
                li.hidden = !match;
            }
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
        this.#filteredItems.loadout.clear();

        const elements = html.querySelectorAll('.items-list .inventory-item, .card-list .card-item');

        for (const li of elements) {
            const item = this.document.items.get(li.dataset.itemId);
            const match = !query || foundry.applications.ux.SearchFilter.testQuery(rgx, item.name);
            if (match) this.#filteredItems.loadout.add(item.id);
            li.hidden = !match;
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
            title: game.i18n.format('DAGGERHEART.Chat.DualityRoll.AbilityCheckTitle', { ability: abilityLabel }),
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
        await game.user.setFlag(SYSTEM.id, SYSTEM.FLAGS.displayDomainCardsAsList, newAbilityView);
        this.render();
    }

    static async toggleLoadoutView(_, button) {
        const newAbilityView = !(button.dataset.value === 'true');
        await game.user.setFlag(SYSTEM.id, SYSTEM.FLAGS.displayDomainCardsAsList, newAbilityView);
        this.render();
    }

    static async attackRoll(event, button) {
        const weapon = await fromUuid(button.dataset.weapon);
        if (!weapon) return;

        const wasUsed = await weapon.use(event);
        if (wasUsed) {
            Hooks.callAll(SYSTEM.HOOKS.characterAttack, {});
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
            ui.notifications.error(game.i18n.localize('DAGGERHEART.Sheets.PC.Errors.missingClassOrSubclass'));
            return;
        }

        new DhlevelUp(this.document).render(true);
    }

    static async useDomainCard(event, button) {
        const card = this.getItem(event);
        if (!card) return;

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: `${game.i18n.localize('DAGGERHEART.Chat.DomainCard.Title')} - ${capitalize(button.dataset.domain)}`,
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
                'systems/daggerheart/templates/chat/ability-use.hbs',
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

    static async selectAncestry() {
        const dialogClosed = new Promise((resolve, _) => {
            new AncestrySelectionDialog(resolve).render(true);
        });
        const result = await dialogClosed;

        for (var ancestry of this.document.items.filter(x => x => x.type === 'ancestry')) {
            await ancestry.delete();
        }

        const createdItems = [];
        for (var feature of this.document.items.filter(
            x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.ancestry.id
        )) {
            await feature.delete();
        }

        createdItems.push(result.data);

        await this.document.createEmbeddedDocuments('Item', createdItems);
    }

    static async selectCommunity() {
        (await game.packs.get('daggerheart.communities'))?.render(true);
    }

    static async useItem(event, button) {
        const item = this.getItem(button);
        if (!item) return;
        const wasUsed = await item.use(event);
        if (wasUsed && item.type === 'weapon') {
            Hooks.callAll(SYSTEM.HOOKS.characterAttack, {});
        }
    }

    static async viewObject(event, button) {
        const item = this.getItem(event);
        if (!item) return;
        item.sheet.render(true);
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

    static async addScar() {
        if (this.document.system.story.scars.length === 5) return;

        await this.document.update({
            'system.story.scars': [
                ...this.document.system.story.scars,
                { name: game.i18n.localize('DAGGERHEART.Sheets.PC.NewScar'), description: '' }
            ]
        });
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

    static async deleteItem(event, button) {
        const item = this.getItem(event);
        if (!item) return;
        await item.delete();
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
            title: game.i18n.localize('DAGGERHEART.Chat.FeatureTitle'),
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
                'systems/daggerheart/templates/chat/ability-use.hbs',
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
                name: game.i18n.localize('DAGGERHEART.General.Experience.Single'),
                description: `${experience.description} ${
                    experience.total < 0 ? experience.total : `+${experience.total}`
                }`
            };
            const msg = new cls({
                type: 'abilityUse',
                user: game.user.id,
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/chat/ability-use.hbs',
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
            `DAGGERHEART.Sheets.PC.DomainCard.${capitalize(button.dataset.key)}Title`
        )}`;

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle'),
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
                'systems/daggerheart/templates/chat/ability-use.hbs',
                systemData
            )
        });

        cls.create(msg.toObject());
    }

    static async useAdvancementAbility(_, button) {
        const item = this.document.items.find(x => x.uuid === button.dataset.id);

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle'),
            origin: this.document.id,
            name: item.name,
            img: item.img,
            description: item.system.description
        };
        const msg = new cls({
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/ability-use.hbs',
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
}
