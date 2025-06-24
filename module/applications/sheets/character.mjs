import { capitalize } from '../../helpers/utils.mjs';
import DhpDeathMove from '../deathMove.mjs';
import DhpDowntime from '../downtime.mjs';
import AncestrySelectionDialog from '../ancestrySelectionDialog.mjs';
import DaggerheartSheet from './daggerheart-sheet.mjs';
import { abilities } from '../../config/actorConfig.mjs';
import DhlevelUp from '../levelup.mjs';
import DHDualityRoll from '../../data/chat-message/dualityRoll.mjs';

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
            attackRoll: this.attackRoll,
            useDomainCard: this.useDomainCard,
            removeCard: this.removeDomainCard,
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
            useAbility: this.useAbility,
            useAdvancementCard: this.useAdvancementCard,
            useAdvancementAbility: this.useAdvancementAbility,
            toggleEquipItem: this.toggleEquipItem,
            levelup: this.openLevelUp,
            editImage: this._onEditImage
        },
        window: {
            resizable: true
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.weapon-section' },
            { dragSelector: null, dropSelector: '.armor-section' },
            { dragSelector: '.item-list .item', dropSelector: null }
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

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        // htmlElement.querySelector('.level-value').addEventListener('change', this.onLevelChange.bind(this));
        // To Remove when ContextMenu Handler is made
        htmlElement
            .querySelectorAll('[data-item-id]')
            .forEach(element => element.addEventListener('contextmenu', this.editItem.bind(this)));
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
                nrTotal: nrLoadoutCards
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
            }
        };

        if (context.inventory.length === 0) {
            context.inventory = Array(1).fill(Array(5).fill([]));
        }

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

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
                /* label: abilityLabel,
                modifier: button.dataset.value */
            }
            /* chatMessage: {
                template: 'systems/daggerheart/templates/chat/duality-roll.hbs'
            } */
        };
        this.document.diceRoll(config);

        // Delete when new roll logic test done
        /* const { roll, hope, fear, advantage, disadvantage, modifiers } = await this.document.dualityRoll(
            { title: game.i18n.localize(abilities[button.dataset.attribute].label), value: button.dataset.value },
            event.shiftKey
        );

        const cls = getDocumentClass('ChatMessage');

        const systemContent = new DHDualityRoll({
            title: game.i18n.format('DAGGERHEART.Chat.DualityRoll.AbilityCheckTitle', {
                ability: game.i18n.localize(abilities[button.dataset.attribute].label)
            }),
            origin: this.document.id,
            roll: roll._formula,
            modifiers: modifiers,
            hope: hope,
            fear: fear,
            advantage: advantage,
            disadvantage: disadvantage
        });

        await cls.create({
            type: 'dualityRoll',
            sound: CONFIG.sounds.dice,
            system: systemContent,
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/duality-roll.hbs',
                systemContent
            ),
            rolls: [roll]
        }); */
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

    static async attackRoll(event, button) {
        const weapon = await fromUuid(button.dataset.weapon);
        if (!weapon) return;

        const wasUsed = await weapon.use(event);
        if (wasUsed) {
            Hooks.callAll(SYSTEM.HOOKS.characterAttack, {});
        }
    }

    static openLevelUp() {
        if (!this.document.system.class.value || !this.document.system.class.subclass) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.Sheets.PC.Errors.missingClassOrSubclass'));
            return;
        }

        new DhlevelUp(this.document).render(true);
    }

    static async useDomainCard(_, button) {
        const card = this.document.items.find(x => x.uuid === button.dataset.key);

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

    static async removeDomainCard(_, button) {
        if (button.dataset.type === 'domainCard') {
            const card = this.document.items.find(x => x.uuid === button.dataset.key);
            await card.delete();
        }
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

    static useItem(event) {
        const uuid = event.target.closest('[data-item-id]').dataset.itemId,
            item = this.document.items.find(i => i.uuid === uuid);
        item.use(event);
    }

    static async viewObject(_, button) {
        const object = await fromUuid(button.dataset.value);
        if (!object) return;

        const tab = button.dataset.tab;
        if (tab && object.sheet._tabs) object.sheet._tabs[0].active = tab;

        if (object.sheet.editMode) object.sheet.editMode = false;

        object.sheet.render(true);
    }

    editItem(event) {
        const uuid = event.target.closest('[data-item-id]').dataset.itemId,
            item = this.document.items.find(i => i.uuid === uuid);
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
        if (this.document.system.resources.hitPoints.value === this.document.system.resources.hitPoints.max) {
            await new DhpDeathMove(this.document).render(true);
            await this.minimize();
        }
    }

    async itemUpdate(event) {
        const name = event.currentTarget.dataset.item;
        const item = await fromUuid($(event.currentTarget).closest('[data-item-id]')[0].dataset.itemId);
        await item.update({ [name]: event.currentTarget.value });
    }

    async onLevelChange(event) {
        await this.document.updateLevel(Number(event.currentTarget.value));
        this.render();
    }

    static async deleteItem(_, button) {
        const item = await fromUuid($(button).closest('[data-item-id]')[0].dataset.itemId);
        await item.delete();
    }

    static async setItemQuantity(button, value) {
        const item = await fromUuid($(button).closest('[data-item-id]')[0].dataset.itemId);
        await item.update({ 'system.quantity': Math.max(item.system.quantity + value, 1) });
    }

    static async useFeature(_, button) {
        const item = await fromUuid(button.dataset.id);

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

    static async useAbility(_, button) {
        const item = await fromUuid(button.dataset.feature);
        const type = button.dataset.type;

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title:
                type === 'ancestry'
                    ? game.i18n.localize('DAGGERHEART.Chat.FoundationCard.AncestryTitle')
                    : type === 'community'
                      ? game.i18n.localize('DAGGERHEART.Chat.FoundationCard.CommunityTitle')
                      : game.i18n.localize('DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle'),
            origin: this.document.id,
            img: item.img,
            name: item.name,
            description: item.system.description,
            actions: []
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

    static async useAdvancementCard(_, button) {
        const item =
            button.dataset.multiclass === 'true'
                ? this.document.system.multiclass.subclass
                : this.document.system.class.subclass;
        const ability = item.system[`${button.dataset.key}Feature`];
        const title = `${item.name} - ${game.i18n.localize(`DAGGERHEART.Sheets.PC.DomainCard.${capitalize(button.dataset.key)}Title`)}`;

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

    static async toggleEquipItem(_, button) {
        const item = this.document.items.get(button.id);
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
