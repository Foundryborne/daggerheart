import { capitalize } from '../../helpers/utils.mjs';
import DhpDeathMove from '../deathMove.mjs';
import DhpDowntime from '../downtime.mjs';
import DhpLevelup from '../levelup.mjs';
import AncestrySelectionDialog from '../ancestrySelectionDialog.mjs';
import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;
export default class PCSheet extends DaggerheartSheet(ActorSheetV2) {
    constructor(options = {}) {
        super(options);

        this.editAttributes = false;
        this.onVaultTab = false;
        this.currentInventoryPage = 0;
        this.selectedScar = null;
        this.storyEditor = null;
        this.dropItemBlock = false;
        this.multiclassFeatureSetSelected = false;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-pc',
        classes: ['daggerheart', 'sheet', 'pc'],
        position: { width: 810, height: 1080 },
        actions: {
            toggleEditAttributes: this.toggleEditAttributes,
            attributeRoll: this.rollAttribute,
            toggleMarks: this.toggleMarks,
            toggleAttributeMark: this.toggleAttributeMark,
            toggleHP: this.toggleHP,
            toggleStress: this.toggleStress,
            toggleHope: this.toggleHope,
            toggleGold: this.toggleGold,
            attackRoll: this.attackRoll,
            tabToLoadout: () => this.domainCardsTab(false),
            tabToVault: () => this.domainCardsTab(true),
            sendToVault: (_, button) => this.moveDomainCard(button, true),
            sentToLoadout: (_, button) => this.moveDomainCard(button, false),
            useDomainCard: this.useDomainCard,
            selectClass: this.selectClass,
            selectSubclass: this.selectSubclass,
            selectAncestry: this.selectAncestry,
            selectCommunity: this.selectCommunity,
            viewObject: this.viewObject,
            useFeature: this.useFeature,
            takeShortRest: this.takeShortRest,
            takeLongRest: this.takeLongRest,
            removeActiveItem: this.removeActiveItem,
            removeInventoryWeapon: this.removeInventoryWeapon,
            addMiscItem: this.addMiscItem,
            deleteItem: this.deleteItem,
            addScar: this.addScar,
            selectScar: this.selectScar,
            deleteScar: this.deleteScar,
            makeDeathMove: this.makeDeathMove,
            toggleFeatureDice: this.toggleFeatureDice,
            setStoryEditor: this.setStoryEditor,
            itemQuantityDecrease: (_, button) => this.setItemQuantity(button, -1),
            itemQuantityIncrease: (_, button) => this.setItemQuantity(button, 1),
            useAbility: this.useAbility,
            useAdvancementCard: this.useAdvancementCard,
            useAdvancementAbility: this.useAdvancementAbility,
            selectFeatureSet: this.selectFeatureSet
        },
        window: {
            //frame: boolean;
            //positioned: boolean;
            //title: string;
            //icon: string | false;
            //controls: ApplicationHeaderControlsEntry[];
            minimizable: false,
            resizable: true
            //contentTag: string;
            //contentClasses: string[];
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.weapon-section' },
            { dragSelector: null, dropSelector: '.armor-section' },
            { dragSelector: null, dropSelector: '.inventory-weapon-section-first' },
            { dragSelector: null, dropSelector: '.inventory-weapon-section-second' },
            { dragSelector: '.item-list .item', dropSelector: null }
        ]
    };

    static PARTS = {
        form: {
            id: 'pc',
            template: 'systems/daggerheart/templates/sheets/pc/pc.hbs'
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
        $(htmlElement).find('.attribute-value').on('change', this.attributeChange.bind(this));
        $(htmlElement).find('.tab-selector').on('click', this.tabSwitch.bind(this));
        $(htmlElement).find('.level-title.levelup').on('click', this.openLevelUp.bind(this));
        $(htmlElement).find('.feature-input').on('change', this.onFeatureInputBlur.bind(this));
        $(htmlElement).find('.experience-description').on('change', this.experienceDescriptionChange.bind(this));
        $(htmlElement).find('.experience-value').on('change', this.experienceValueChange.bind(this));
        $(htmlElement).find('[data-item]').on('change', this.itemUpdate.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = this._getTabs();

        context.config = SYSTEM;
        context.editAttributes = this.editAttributes;
        context.onVaultTab = this.onVaultTab;
        context.selectedScar = this.selectedScar;
        context.storyEditor = this.storyEditor;
        context.multiclassFeatureSetSelected = this.multiclassFeatureSetSelected;

        const selectedAttributes = Object.values(this.document.system.attributes).map(x => x.data.base);
        context.abilityScoreArray = JSON.parse(
            await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.AbilityArray)
        ).reduce((acc, x) => {
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

        context.domains = this.document.system.class
            ? {
                  first: this.document.system.class.system.domains[0]
                      ? SYSTEM.DOMAIN.domains[this.document.system.class.system.domains[0]].src
                      : null,
                  second: this.document.system.class.system.domains[1]
                      ? SYSTEM.DOMAIN.domains[this.document.system.class.system.domains[1]].src
                      : null
              }
            : {};

        context.attributes = Object.keys(this.document.system.attributes).reduce((acc, key) => {
            acc[key] = {
                ...this.document.system.attributes[key],
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
            advancement: {
                ...this.mapAdvancementFeatures(this.document, SYSTEM)
            }
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
                sendToLoadoutDisabled:
                    this.document.system.domainCards.loadout.length >= this.document.system.domainData.maxLoadout
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
            }
        };

        if (context.inventory.length === 0) {
            context.inventory = Array(1).fill(Array(5).fill([]));
        }

        context.classFeatures = (
            this.multiclassFeatureSetSelected
                ? this.document.system.multiclassFeatures
                : this.document.system.classFeatures
        ).map(x => {
            if (x.system.featureType.type !== 'dice') {
                return x;
            }

            return {
                ...x,
                uuid: x.uuid,
                system: {
                    ...x.system,
                    featureType: {
                        ...x.system.featureType,
                        data: {
                            ...x.system.featureType.data,
                            property: this.document.system.subclass
                                ? SYSTEM.ACTOR.featureProperties[x.system.featureType.data.property].path(this.document)
                                : 0
                        }
                    }
                }
            };
        });

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

    mapAdvancementFeatures(actor, config) {
        if (!actor.system.subclass) return { foundation: null, advancements: [] };

        const { subclass, multiclassSubclass } = actor.system.subclassFeatures;

        const foundation = {
            type: 'foundation',
            multiclass: false,
            img: actor.system.subclass.img,
            subtitle: game.i18n.localize('DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle'),
            domains: actor.system.class.system.domains.map(x => config.DOMAIN.domains[x].src),
            className: actor.system.class.name,
            subclassUuid: actor.system.subclass.uuid,
            subclassName: actor.system.subclass.name,
            spellcast: config.ACTOR.abilities[actor.system.subclass.system.spellcastingTrait]?.name ?? null,
            description: actor.system.subclass.system.foundationFeature.description,
            abilities: subclass.foundation,
            abilityKey: 'foundationFeature'
        };

        const firstKey =
            actor.system.subclass.system.specializationFeature.unlocked &&
            actor.system.subclass.system.specializationFeature.tier === 2
                ? 'sub'
                : actor.system.multiclass?.system?.multiclassTier === 2
                  ? 'multi'
                  : null;
        const firstType = firstKey === 'sub' ? 'specialization' : 'foundation';
        const firstBase =
            firstKey === 'sub' ? actor.system.subclass : firstKey === 'multi' ? actor.system.multiclassSubclass : null;
        const first = !firstBase
            ? null
            : {
                  type: firstType,
                  multiclass: firstKey === 'multi',
                  img: firstBase.img,
                  subtitle:
                      firstKey === 'sub'
                          ? game.i18n.localize('DAGGERHEART.Sheets.PC.DomainCard.SpecializationTitle')
                          : game.i18n.localize('DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle'),
                  domains:
                      firstKey === 'sub'
                          ? actor.system.class.system.domains.map(x => config.DOMAIN.domains[x].src)
                          : actor.system.multiclass.system.domains.map(x => config.DOMAIN.domains[x].src),
                  className: firstKey === 'sub' ? actor.system.class.name : actor.system.multiclass.name,
                  subclassUuid: firstBase.uuid,
                  subclassName: firstBase.name,
                  spellcast:
                      firstKey === 'sub'
                          ? null
                          : (config.ACTOR.abilities[firstBase.system.spellcastingTrait]?.name ?? null),
                  description:
                      firstKey === 'sub'
                          ? firstBase.system.specializationFeature.description
                          : firstBase.system.foundationFeature.description,
                  abilities: firstKey === 'sub' ? subclass.specialization : multiclassSubclass.foundation,
                  abilityKey: firstKey === 'sub' ? 'specializationFeature' : 'foundationFeature'
              };

        const secondKey =
            (actor.system.subclass.system.specializationFeature.unlocked &&
                actor.system.subclass.system.specializationFeature.tier === 3) ||
            (actor.system.subclass.system.masteryFeature.unlocked &&
                actor.system.subclass.system.masteryFeature.tier === 3)
                ? 'sub'
                : actor.system.multiclass?.system?.multiclassTier === 3 ||
                    actor.system.multiclassSubclass?.system?.specializationFeature?.unlocked
                  ? 'multi'
                  : null;
        const secondBase =
            secondKey === 'sub'
                ? actor.system.subclass
                : secondKey === 'multi'
                  ? actor.system.multiclassSubclass
                  : null;
        const secondAbilities = secondKey === 'sub' ? subclass : multiclassSubclass;
        const secondType = secondBase
            ? secondBase.system.masteryFeature.unlocked
                ? 'mastery'
                : secondBase.system.specializationFeature.unlocked
                  ? 'specialization'
                  : 'foundation'
            : null;
        const second = !secondBase
            ? null
            : {
                  type: secondType,
                  multiclass: secondKey === 'multi',
                  img: secondBase.img,
                  subtitle: secondBase.system.masteryFeature.unlocked
                      ? game.i18n.localize('DAGGERHEART.Sheets.PC.DomainCard.MasteryTitle')
                      : secondBase.system.specializationFeature.unlocked
                        ? game.i18n.localize('DAGGERHEART.Sheets.PC.DomainCard.SpecializationTitle')
                        : game.i18n.localize('DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle'),
                  domains:
                      secondKey === 'sub'
                          ? actor.system.class.system.domains.map(x => config.DOMAIN.domains[x].src)
                          : actor.system.multiclass.system.domains.map(x => config.DOMAIN.domains[x].src),
                  className: secondKey === 'sub' ? actor.system.class.name : actor.system.multiclass.name,
                  subclassUuid: secondBase.uuid,
                  subclassName: secondBase.name,
                  spellcast:
                      secondKey === 'sub' || secondBase.system.specializationFeature.unlocked
                          ? null
                          : (config.ACTOR.abilities[firstBase.system.spellcastingTrait]?.name ?? null),
                  description: secondBase.system.masteryFeature.unlocked
                      ? secondBase.system.masteryFeature.description
                      : secondBase.system.specializationFeature.unlocked
                        ? secondBase.system.specializationFeature.description
                        : firstBase.system.foundationFeature.description,
                  abilities: secondBase.system.masteryFeature.unlocked
                      ? secondAbilities.mastery
                      : secondBase.system.specializationFeature.unlocked
                        ? secondAbilities.specialization
                        : secondAbilities.foundation,
                  abilityKey: secondBase.system.masteryFeature.unlocked
                      ? 'masteryFeature'
                      : secondBase.system.specializationFeature.unlocked
                        ? 'specializationFeature'
                        : 'foundationFeature'
              };

        return {
            foundation: foundation,
            first: first,
            second: second
        };
    }

    async attributeChange(event) {
        const path = `system.attributes.${event.currentTarget.dataset.attribute}.data.base`;
        await this.document.update({ [path]: event.currentTarget.value });
    }

    static toggleEditAttributes() {
        this.editAttributes = !this.editAttributes;
        this.render();
    }

    static async rollAttribute(event, target) {
        const { roll, hope, fear, advantage, disadvantage, modifiers } = await this.document.dualityRoll(
            { title: 'Attribute Bonus', value: event.target.dataset.value },
            event.shiftKey
        );

        const cls = getDocumentClass('ChatMessage');
        const msgData = {
            type: 'dualityRoll',
            system: {
                roll: roll._formula,
                modifiers: modifiers,
                hope: hope,
                fear: fear,
                advantage: advantage,
                disadvantage: disadvantage
            },
            user: game.user.id,
            content: 'systems/daggerheart/templates/chat/duality-roll.hbs',
            rolls: [roll]
        };

        await cls.create(msgData);
    }

    static async toggleMarks(_, button) {
        const markValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.armor.system.marks.value >= markValue ? markValue - 1 : markValue;
        await this.document.system.armor.update({ 'system.marks.value': newValue });
    }

    static async toggleAttributeMark(_, button) {
        const attribute = this.document.system.attributes[button.dataset.attribute];
        const newMark = this.document.system.availableAttributeMarks
            .filter(x => x > Math.max.apply(null, this.document.system.attributes[button.dataset.attribute].levelMarks))
            .sort((a, b) => (a > b ? 1 : -1))[0];

        if (attribute.levelMark || !newMark) return;

        const path = `system.attributes.${button.dataset.attribute}.levelMarks`;
        await this.document.update({ [path]: [...attribute.levelMarks, newMark] });
    }

    static async toggleHP(_, button) {
        const healthValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.resources.health.value >= healthValue ? healthValue - 1 : healthValue;
        await this.document.update({ 'system.resources.health.value': newValue });
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

    static async attackRoll(_, event) {
        const weapon = await fromUuid(event.currentTarget.dataset.weapon);
        const damage = {
            value: `${this.document.system.proficiency.value}${weapon.system.damage.value}`,
            type: weapon.system.damage.type,
            bonusDamage: this.document.system.bonuses.damage
        };
        const modifier = this.document.system.attributes[weapon.system.trait].data.value;

        const { roll, hope, fear, advantage, disadvantage, modifiers, bonusDamageString } =
            await this.document.dualityRoll(
                { title: 'Attribute Modifier', value: modifier },
                event.shiftKey,
                damage.bonusDamage
            );

        damage.value = damage.value.concat(bonusDamageString);

        const targets = Array.from(game.user.targets).map(x => ({
            id: x.id,
            name: x.actor.name,
            img: x.actor.img,
            difficulty: x.actor.system.difficulty,
            evasion: x.actor.system.evasion
        }));

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            type: 'dualityRoll',
            system: {
                roll: roll._formula,
                modifiers: modifiers,
                hope: hope,
                fear: fear,
                advantage: advantage,
                disadvantage: disadvantage,
                damage: damage,
                targets: targets
            },
            content: 'systems/daggerheart/templates/chat/attack-roll.hbs',
            rolls: [roll]
        });

        await cls.create(msg.toObject());
    }

    tabSwitch(event) {
        const tab = event.currentTarget.dataset.tab;
        if (tab !== 'loadout') {
            this.onVaultTab = false;
        }

        this.render();
    }

    openLevelUp() {
        new DhpLevelup(this.document).render(true);
    }

    static domainCardsTab(toVault) {
        this.onVaultTab = toVault;
        this.render();
    }

    static async moveDomainCard(button, toVault) {
        if (!toVault && this.document.system.domainCards.loadout.length >= this.document.system.domainData.maxLoadout) {
            return;
        }

        const card = this.document.items.find(x => x.uuid === button.dataset.domain);
        await card.update({ 'system.inVault': toVault });
    }

    static async useDomainCard(_, button) {
        const card = this.document.items.find(x => x.uuid === button.dataset.key);

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            content: 'systems/daggerheart/templates/chat/ability-use.hbs',
            system: {
                title: `${game.i18n.localize('DAGGERHEART.Chat.DomainCard.Title')} - ${capitalize(button.dataset.domain)}`,
                img: card.img,
                name: card.name,
                description: card.system.effect,
                actions: card.system.actions
            }
        });

        cls.create(msg.toObject());
    }

    static async selectClass() {
        (await game.packs.get('daggerheart.playtest-classes'))?.render(true);
    }

    static async selectSubclass() {
        (await game.packs.get('daggerheart.playtest-subclasses'))?.render(true);
    }

    static async selectAncestry() {
        const dialogClosed = new Promise((resolve, _) => {
            new AncestrySelectionDialog(resolve).render(true);
        });
        const result = await dialogClosed;

        // await this.emulateItemDrop({ type: 'item', data: result });
        for (var ancestry of this.document.items.filter(x => x => x.type === 'ancestry')) {
            await ancestry.delete();
        }

        const createdItems = [];
        for (var feature of this.document.items.filter(
            x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.ancestry.id
        )) {
            await feature.delete();
        }

        // createdItems.push(...result.data.system.abilities);
        createdItems.push(result.data);

        await this.document.createEmbeddedDocuments('Item', createdItems);

        // await this.document.createEmbeddedDocuments("Item", [result.toObject()]);
        // (await game.packs.get('daggerheart.playtest-ancestries'))?.render(true);
    }

    static async selectCommunity() {
        (await game.packs.get('daggerheart.playtest-communities'))?.render(true);
    }

    static async viewObject(button) {
        const object = await fromUuid(button.dataset.value);
        if (!object) return;

        const tab = button.dataset.tab;
        if (tab) object.sheet._tabs[0].active = tab;

        if (object.sheet.editMode) object.sheet.editMode = false;

        object.sheet.render(true);
    }

    static async takeShortRest() {
        await new DhpDowntime(this.document, true).render(true);
        await this.minimize();
    }

    static async takeLongRest() {
        await new DhpDowntime(this.document, false).render(true);
        await this.minimize();
    }

    static async removeActiveItem(_, event) {
        event.stopPropagation();
        const item = await fromUuid(event.currentTarget.dataset.item);
        await item.delete();
    }

    static async removeInventoryWeapon(_, event) {
        event.stopPropagation();
        const item = await fromUuid(event.currentTarget.dataset.item);
        await item.delete();
    }

    static async addMiscItem() {
        const result = await this.document.createEmbeddedDocuments('Item', [
            {
                name: game.i18n.localize('DAGGERHEART.Sheets.PC.NewItem'),
                type: 'miscellaneous'
            }
        ]);

        await result[0].sheet.render(true);
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

    static async selectScar(_, button) {
        this.selectedScar = Number.parseInt(button.dataset.value);
        this.render();
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
        if (this.document.system.resources.health.value === this.document.system.resources.health.max) {
            await new DhpDeathMove(this.document).render(true);
            await this.minimize();
        }
    }

    static async toggleFeatureDice(_, button) {
        const index = Number.parseInt(button.dataset.index);
        const feature = this.document.system.classFeatures.find(x => x.uuid === button.dataset.feature);
        const path = `system.featureType.data.numbers.${index}`;
        if (feature.system.featureType.data.numbers[index]?.used) return;

        if (Object.keys(feature.system.featureType.data.numbers).length <= index) {
            const roll = new Roll(feature.system.featureType.data.value);
            const rollData = await roll.evaluate();
            const cls = getDocumentClass('ChatMessage');
            const msg = new cls({
                user: game.user.id,
                rolls: [roll]
            });

            await cls.create(msg.toObject());

            await feature.update({ [path]: { value: Number.parseInt(rollData.total), used: false } });
        } else {
            await Dialog.confirm({
                title: game.i18n.localize('Confirm feature use'),
                content: `Are you sure you want to use ${feature.name}?`,
                yes: async () => {
                    await feature.update({ [path]: { used: true } });

                    const cls = getDocumentClass('ChatMessage');
                    const msg = new cls({
                        user: game.user.id,
                        content: await renderTemplate('systems/daggerheart/templates/chat/ability-use.hbs', {
                            title: game.i18n.localize('DAGGERHEART.Chat.FeatureTitle'),
                            card: {
                                name: `${feature.name} - Roll Of ${feature.system.featureType.data.numbers[index].value}`,
                                img: feature.img
                            }
                        })
                    });

                    cls.create(msg.toObject());
                },
                no: () => {
                    return;
                },
                defaultYes: false
            });
        }
    }

    async onFeatureInputBlur(event) {
        const feature = this.document.system.classFeatures.find(x => x.uuid === event.currentTarget.dataset.feature);
        const value = Number.parseInt(event.currentTarget.value);
        if (!Number.isNaN(value)) await feature?.update({ 'system.featureType.data.value': value });
    }

    async experienceDescriptionChange(event) {
        const newExperiences = [...this.document.system.experiences];
        newExperiences[event.currentTarget.dataset.index].description = event.currentTarget.value;
        await this.document.update({ 'system.experiences': newExperiences });
    }

    async experienceValueChange(event) {
        const newExperiences = [...this.document.system.experiences];
        newExperiences[event.currentTarget.dataset.index].value = event.currentTarget.value;
        await this.document.update({ 'system.experiences': newExperiences });
    }

    static setStoryEditor(_, button) {
        this.storyEditor = this.storyEditor === button.dataset.value ? null : button.dataset.value;
        this.render();
    }

    async itemUpdate(event) {
        const name = event.currentTarget.dataset.item;
        const item = await fromUuid($(event.currentTarget).closest('[data-item-id]')[0].dataset.itemId);
        await item.update({ [name]: event.currentTarget.value });
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
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            content: 'systems/daggerheart/templates/chat/ability-use.hbs',
            system: {
                title: game.i18n.localize('DAGGERHEART.Chat.FeatureTitle'),
                img: item.img,
                name: item.name,
                description: item.system.description,
                actions: item.system.actions
            }
        });

        cls.create(msg.toObject());
    }

    static async useAbility(_, button) {
        const item = await fromUuid(button.dataset.feature);
        const type = button.dataset.type;

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            system: {
                title:
                    type === 'ancestry'
                        ? game.i18n.localize('DAGGERHEART.Chat.FoundationCard.AncestryTitle')
                        : type === 'community'
                          ? game.i18n.localize('DAGGERHEART.Chat.FoundationCard.CommunityTitle')
                          : game.i18n.localize('DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle'),
                img: item.img,
                name: item.name,
                description: item.system.description,
                actions: []
            },
            content: 'systems/daggerheart/templates/chat/ability-use.hbs'
        });

        cls.create(msg.toObject());
    }

    static async useAdvancementCard(_, button) {
        const item =
            button.dataset.multiclass === 'true'
                ? this.document.system.multiclassSubclass
                : this.document.system.subclass;
        const ability = item.system[`${button.dataset.key}Feature`];
        const title = `${item.name} - ${game.i18n.localize(`DAGGERHEART.Sheets.PC.DomainCard.${capitalize(button.dataset.key)}Title`)}`;

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await renderTemplate('systems/daggerheart/templates/chat/ability-use.hbs', {
                title: game.i18n.localize('DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle'),
                card: { name: title, img: item.img, description: ability.description }
            })
        });

        cls.create(msg.toObject());
    }

    static async useAdvancementAbility(_, button) {
        // const item = await fromUuid(button.dataset.id);
        const item = this.document.items.find(x => x.uuid === button.dataset.id);

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await renderTemplate('systems/daggerheart/templates/chat/ability-use.hbs', {
                title: game.i18n.localize('DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle'),
                card: { name: item.name, img: item.img, description: item.system.description }
            })
        });

        cls.create(msg.toObject());
    }

    static async selectFeatureSet(_, button) {
        const multiclass = button.dataset.multiclass === 'true';
        this.multiclassFeatureSetSelected = multiclass;
        this.render();
    }

    static async close(options) {
        this.onVaultTab = false;
        super.close(options);
    }

    async _onDragStart(_, event) {
        if (event.currentTarget.classList.contains('inventory-item')) {
            if (!['weapon', 'armor'].includes(event.currentTarget.dataset.type)) {
                return;
            }

            const targets = {
                weapon: ['weapon-section', 'inventory-weapon-section'],
                armor: ['armor-section', 'inventory-armor-section']
            };

            event.dataTransfer.setData(
                'text/plain',
                JSON.stringify({
                    uuid: event.currentTarget.dataset.item,
                    internal: true,
                    targets: targets[event.currentTarget.dataset.type]
                })
            );
        }

        super._onDragStart(event);
    }

    async _onDrop(event) {
        const itemData = event.dataTransfer?.getData('text/plain');
        const item = itemData ? JSON.parse(itemData) : null;
        if (item?.internal) {
            let target = null;
            event.currentTarget.classList.forEach(x => {
                if (item.targets.some(target => target === x)) {
                    target = x;
                }
            });
            if (target) {
                const itemObject = await fromUuid(item.uuid);
                switch (target) {
                    case 'weapon-section':
                        if (itemObject.system.secondary && this.document.system.activeWeapons.burden === 'twoHanded') {
                            ui.notifications.info(
                                game.i18n.localize('DAGGERHEART.Notification.Info.SecondaryEquipWhileTwohanded')
                            );
                            return;
                        } else if (
                            itemObject.system.burden === 'twoHanded' &&
                            this.document.system.activeWeapons.secondary
                        ) {
                            ui.notifications.info(
                                game.i18n.localize('DAGGERHEART.Notification.Info.TwohandedEquipWhileSecondary')
                            );
                            return;
                        }

                        const existingWeapon = this.document.items.find(
                            x => x.system.active && x.system.secondary === itemObject.system.secondary
                        );
                        await existingWeapon?.update({ 'system.active': false });
                        await itemObject.update({ 'system.active': true });
                        break;
                    case 'armor-section':
                        const existingArmor = this.document.items.find(x => x.type === 'armor' && x.system.active);
                        await existingArmor?.update({ 'system.active': false });
                        await itemObject.update({ 'system.active': true });
                        break;
                    case 'inventory-weapon-section':
                        const existingInventoryWeapon = this.document.items.find(x => x.system.inventoryWeapon);
                        await existingInventoryWeapon?.update({ 'system.inventoryWeapon': false });
                        await itemObject.update({ 'system.inventoryWeapon': true });
                        break;
                    case 'inventory-armor-section':
                        const existingInventoryArmor = this.document.items.find(x => x.system.inventoryArmor);
                        await existingInventoryArmor?.update({ 'system.inventoryArmor': false });
                        await itemObject.update({ 'system.inventoryArmor': true });
                        break;
                }
            }
        } else {
            super._onDrop(event);
            this._onDropItem(event, TextEditor.getDragEventData(event));
        }
    }

    async _onDropItem(event, data) {
        if (this.dropItemBlock) {
            return;
        } else {
            this.dropItemBlock = true;
            setTimeout(() => (this.dropItemBlock = false), 500);
        }

        const element = event.currentTarget;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        const createdItems = [];

        if (item.type === 'domainCard') {
            if (!this.document.system.class) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.NoClassSelected'));
                return;
            }

            if (!this.document.system.domains.find(x => x === item.system.domain)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.LacksDomain'));
                return;
            }

            if (this.document.system.domainCards.total.length === this.document.system.domainData.maxCards) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.MaxLoadoutReached'));
                return;
            }

            if (this.document.system.domainCards.total.find(x => x.name === item.name)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.DuplicateDomainCard'));
                return;
            }

            if (this.document.system.domainCards.loadout.length >= this.document.system.domainData.maxLoadout) {
                itemData.system.inVault = true;
            }

            if (this.document.uuid === item.parent?.uuid) return this._onSortItem(event, itemData);
            const createdItem = await this._onDropItemCreate(itemData);

            return createdItem;
        } else {
            if (!item.system.multiclass && ['class', 'subclass', 'ancestry', 'community'].includes(item.type)) {
                const existing = this.document.items.find(x => x.type === item.type);
                await existing?.delete();
            }

            if (item.type === 'subclass') {
                if (!item.system.multiclass) {
                    if (!this.document.system.class) {
                        ui.notifications.info(
                            game.i18n.localize('DAGGERHEART.Notification.Info.SelectClassBeforeSubclass')
                        );
                        return;
                    } else if (!this.document.system.class.system.subclasses.some(x => x.uuid === item.uuid)) {
                        ui.notifications.info(game.i18n.localize('DAGGERHEART.Notification.Info.SubclassNotOfClass'));
                        return;
                    }

                    for (var feature of this.document.items.filter(
                        x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.subclass.id
                    )) {
                        await feature.delete();
                    }
                }

                const features = [
                    itemData.system.foundationFeature,
                    itemData.system.specializationFeature,
                    itemData.system.masteryFeature
                ];
                for (var i = 0; i < features.length; i++) {
                    const feature = features[i];
                    for (var ability of feature.abilities) {
                        const data = (await fromUuid(ability.uuid)).toObject();
                        if (i > 0) data.system.disabled = true;
                        data.uuid = itemData.uuid;

                        const abilityData = await this._onDropItemCreate(data);
                        ability.uuid = abilityData[0].uuid;

                        createdItems.push(abilityData);
                    }
                }
            } else if (item.type === 'class') {
                if (!item.system.multiclass) {
                    for (var feature of this.document.items.filter(
                        x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.class.id
                    )) {
                        await feature.delete();
                    }
                }

                for (var feature of item.system.features) {
                    const data = (await fromUuid(feature.uuid)).toObject();
                    const itemData = await this._onDropItemCreate(data);
                    createdItems.push(itemData);
                }
            } else if (item.type === 'ancestry') {
                for (var feature of this.document.items.filter(
                    x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.ancestry.id
                )) {
                    await feature.delete();
                }

                for (var feature of item.system.abilities) {
                    const data = (await fromUuid(feature.uuid)).toObject();
                    const itemData = await this._onDropItemCreate(data);
                    createdItems.push(itemData);
                }
            } else if (item.type === 'community') {
                for (var feature of this.document.items.filter(
                    x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.community.id
                )) {
                    await feature.delete();
                }

                for (var feature of item.system.abilities) {
                    const data = (await fromUuid(feature.uuid)).toObject();
                    const itemData = await this._onDropItemCreate(data);
                    createdItems.push(itemData);
                }
            }

            if (this.document.uuid === item.parent?.uuid) return this._onSortItem(event, item);

            if (item.type === 'weapon') {
                if (!element) return;

                if (element.classList.contains('weapon-section')) {
                    if (item.system.secondary && this.document.system.activeWeapons.burden === 'twoHanded') {
                        ui.notifications.info(
                            game.i18n.localize('DAGGERHEART.Notification.Info.SecondaryEquipWhileTwohanded')
                        );
                        return;
                    } else if (item.system.burden === 'twoHanded' && this.document.system.activeWeapons.secondary) {
                        ui.notifications.info(
                            game.i18n.localize('DAGGERHEART.Notification.Info.TwohandedEquipWhileSecondary')
                        );
                        return;
                    }

                    const existing =
                        this.document.system.activeWeapons.primary && !item.system.secondary
                            ? await fromUuid(this.document.system.activeWeapons.primary.uuid)
                            : this.document.system.activeWeapons.secondary && item.system.secondary
                              ? await fromUuid(this.document.system.activeWeapons.secondary.uuid)
                              : null;
                    await existing?.delete();
                    itemData.system.active = true;
                } else if (element.classList.contains('inventory-weapon-section-first')) {
                    const existing = this.document.system.inventoryWeapons.first
                        ? await fromUuid(this.document.system.inventoryWeapons.first.uuid)
                        : null;
                    await existing?.delete();

                    itemData.system.inventoryWeapon = 1;
                } else if (element.classList.contains('inventory-weapon-section-second')) {
                    const existing = this.document.system.inventoryWeapons.second
                        ? await fromUuid(this.document.system.inventoryWeapons.second.uuid)
                        : null;
                    await existing?.delete();

                    itemData.system.inventoryWeapon = 2;
                } else return [];
            }

            if (item.type === 'armor') {
                if (!element) return;

                if (element.classList.contains('armor-section')) {
                    const existing = this.document.system.armor
                        ? await fromUuid(this.document.system.armor.uuid)
                        : null;
                    await existing?.delete();
                } else return;
            }

            const createdItem = await this._onDropItemCreate(itemData);
            createdItems.push(createdItem);

            return createdItems;
        }
    }

    async _onDropItemCreate(itemData, event) {
        itemData = itemData instanceof Array ? itemData : [itemData];
        return this.document.createEmbeddedDocuments('Item', itemData);
    }

    async emulateItemDrop(data) {
        const event = new DragEvent('drop', { altKey: game.keyboard.isModifierActive('Alt') });
        return this._onDropItem(event, data);
    }
}

// export default class PCSheet extends DhpApplicationMixin(ActorSheet) {
//     static applicationType = "sheets/pc";
//     static documentType = "pc";

//     constructor(actor, options){
//         super(actor, options);

//         this.editAttributes = false;
//         this.onVaultTab = false;
//         this.currentInventoryPage = 0;
//         this.selectedScar = null;
//         this.storyEditor = null;
//         this.dropItemBlock = false;
//         this.multiclassFeatureSetSelected = false;
//     }

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "pc"],
//             width: 810,
//             height: 1080,
//             resizable: false,
//             tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }, { navSelector: ".loadout-tabs", contentSelector: ".loadout-body", initial: "loadout"}],
//             dragDrop: [
//                 {dragSelector: null, dropSelector: ".weapon-section" },
//                 {dragSelector: null, dropSelector: ".armor-section"},
//                 {dragSelector: null, dropSelector: ".inventory-weapon-section-first"},
//                 {dragSelector: null, dropSelector: ".inventory-weapon-section-second"},
//                 {dragSelector: ".item-list .item", dropSelector: null},
//             ]
//         }, { overwrite: true, inplace: true });
//     }

//     async mapFeatureType(data, configType){
//         return await Promise.all(data.map(async x => {
//             const abilities = x.system.abilities ? await Promise.all(x.system.abilities.map(async x => await fromUuid(x.uuid))) : [];

//             return {
//                 ...x,
//                 uuid: x.uuid,
//                 system: {
//                     ...x.system,
//                     abilities: abilities,
//                     type: game.i18n.localize(configType[x.system.type??x.type].label)
//                 }
//             }
//         }));
//     }

//     mapAdvancementFeatures(actor, config) {
//         if(!actor.system.subclass) return { foundation: null, advancements: [] };

//         const { subclass, multiclassSubclass } = actor.system.subclassFeatures;

//         const foundation = {
//             type: 'foundation',
//             multiclass: false,
//             img: actor.system.subclass.img,
//             subtitle: game.i18n.localize("DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle"),
//             domains: actor.system.class.system.domains.map(x => config.DOMAIN.domains[x].src),
//             className: actor.system.class.name,
//             subclassUuid: actor.system.subclass.uuid,
//             subclassName: actor.system.subclass.name,
//             spellcast: config.ACTOR.abilities[actor.system.subclass.system.spellcastingTrait]?.name ?? null,
//             description: actor.system.subclass.system.foundationFeature.description,
//             abilities: subclass.foundation,
//             abilityKey: 'foundationFeature',
//         };

//         const firstKey = actor.system.subclass.system.specializationFeature.unlocked && actor.system.subclass.system.specializationFeature.tier === 2 ? 'sub' :
//         actor.system.multiclass?.system?.multiclassTier === 2 ? 'multi' : null;
//         const firstType = firstKey === 'sub' ? 'specialization' : 'foundation';
//         const firstBase = firstKey === 'sub' ? actor.system.subclass : firstKey === 'multi' ? actor.system.multiclassSubclass : null;
//         const first = !firstBase ? null : {
//             type: firstType,
//             multiclass: firstKey === 'multi',
//             img: firstBase.img,
//             subtitle: firstKey === 'sub' ? game.i18n.localize("DAGGERHEART.Sheets.PC.DomainCard.SpecializationTitle") : game.i18n.localize("DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle"),
//             domains: firstKey === 'sub' ? actor.system.class.system.domains.map(x => config.DOMAIN.domains[x].src) : actor.system.multiclass.system.domains.map(x => config.DOMAIN.domains[x].src),
//             className: firstKey === 'sub' ? actor.system.class.name : actor.system.multiclass.name,
//             subclassUuid: firstBase.uuid,
//             subclassName: firstBase.name,
//             spellcast: firstKey === 'sub' ? null : config.ACTOR.abilities[firstBase.system.spellcastingTrait]?.name ?? null,
//             description: firstKey === 'sub' ? firstBase.system.specializationFeature.description : firstBase.system.foundationFeature.description,
//             abilities: firstKey === 'sub' ? subclass.specialization : multiclassSubclass.foundation,
//             abilityKey: firstKey === 'sub' ? 'specializationFeature' : 'foundationFeature',
//         };

//         const secondKey = (actor.system.subclass.system.specializationFeature.unlocked && actor.system.subclass.system.specializationFeature.tier === 3) || (actor.system.subclass.system.masteryFeature.unlocked && actor.system.subclass.system.masteryFeature.tier === 3) ? 'sub' :
//         (actor.system.multiclass?.system?.multiclassTier === 3) || (actor.system.multiclassSubclass?.system?.specializationFeature?.unlocked) ? 'multi' : null;
//         const secondBase = secondKey === 'sub' ? actor.system.subclass : secondKey === 'multi' ? actor.system.multiclassSubclass : null;
//         const secondAbilities = secondKey === 'sub' ? subclass : multiclassSubclass;
//         const secondType = secondBase ? secondBase.system.masteryFeature.unlocked ? 'mastery' : secondBase.system.specializationFeature.unlocked ? 'specialization' : 'foundation' : null;
//         const second = !secondBase ? null : {
//             type: secondType,
//             multiclass: secondKey === 'multi',
//             img: secondBase.img,
//             subtitle: secondBase.system.masteryFeature.unlocked ? game.i18n.localize("DAGGERHEART.Sheets.PC.DomainCard.MasteryTitle") :
//                 secondBase.system.specializationFeature.unlocked ? game.i18n.localize("DAGGERHEART.Sheets.PC.DomainCard.SpecializationTitle") : game.i18n.localize("DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle"),
//             domains: secondKey === 'sub' ? actor.system.class.system.domains.map(x => config.DOMAIN.domains[x].src) : actor.system.multiclass.system.domains.map(x => config.DOMAIN.domains[x].src),
//             className: secondKey === 'sub' ? actor.system.class.name : actor.system.multiclass.name,
//             subclassUuid: secondBase.uuid,
//             subclassName: secondBase.name,
//             spellcast: secondKey === 'sub' || secondBase.system.specializationFeature.unlocked ? null : config.ACTOR.abilities[firstBase.system.spellcastingTrait]?.name ?? null,
//             description:
//                 secondBase.system.masteryFeature.unlocked ? secondBase.system.masteryFeature.description :
//                 secondBase.system.specializationFeature.unlocked ? secondBase.system.specializationFeature.description : firstBase.system.foundationFeature.description,
//             abilities:
//                 secondBase.system.masteryFeature.unlocked ? secondAbilities.mastery :
//                 secondBase.system.specializationFeature.unlocked ? secondAbilities.specialization : secondAbilities.foundation,
//             abilityKey: secondBase.system.masteryFeature.unlocked ? 'masteryFeature' : secondBase.system.specializationFeature.unlocked ? 'specializationFeature' : 'foundationFeature',
//         };

//         return {
//             foundation: foundation,
//             first: first,
//             second: second,
//         }
//     }

//     /** @override */
//     async getData() {
//         const context = super.getData();
//         context.config = SYSTEM;
//         context.editAttributes = this.editAttributes;
//         context.onVaultTab = this.onVaultTab;
//         context.selectedScar = this.selectedScar;
//         context.storyEditor = this.storyEditor;
//         context.multiclassFeatureSetSelected = this.multiclassFeatureSetSelected;

//         const selectedAttributes = Object.values(this.actor.system.attributes).map(x => x.data.base);
//         context.abilityScoreArray = JSON.parse(await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.AbilityArray)).reduce((acc, x) => {
//             const selectedIndex = selectedAttributes.indexOf(x);
//             if(selectedIndex !== -1){
//                 selectedAttributes.splice(selectedIndex, 1);
//             } else {
//                 acc.push({ name: x, value: x });
//             }

//             return acc;
//         }, []);
//         if(!context.abilityScoreArray.includes(0)) context.abilityScoreArray.push({ name: 0, value: 0 });
//         context.abilityScoresFinished = context.abilityScoreArray.every(x => x.value === 0);

//         context.domains = this.actor.system.class ? {
//             first: this.actor.system.class.system.domains[0] ? SYSTEM.DOMAIN.domains[this.actor.system.class.system.domains[0]].src : null,
//             second: this.actor.system.class.system.domains[1] ? SYSTEM.DOMAIN.domains[this.actor.system.class.system.domains[1]].src : null,
//         } : {  };

//         context.attributes = Object.keys(this.actor.system.attributes).reduce((acc, key) => {
//             acc[key] = {
//                 ...this.actor.system.attributes[key],
//                 name: game.i18n.localize(SYSTEM.ACTOR.abilities[key].name),
//                 verbs: SYSTEM.ACTOR.abilities[key].verbs.map(x => game.i18n.localize(x)),
//             };

//             return acc;
//         }, {});

//         const ancestry = await this.mapFeatureType(this.actor.system.ancestry ? [this.actor.system.ancestry] : [], SYSTEM.GENERAL.objectTypes);
//         const community = await this.mapFeatureType(this.actor.system.community ? [this.actor.system.community] : [], SYSTEM.GENERAL.objectTypes);
//         const foundation = {
//             ancestry: ancestry[0],
//             community: community[0],
//             advancement: {
//                 ...this.mapAdvancementFeatures(this.actor, SYSTEM)
//             }
//         };

//         const nrLoadoutCards = this.actor.system.domainCards.loadout.length;
//         const loadout = await this.mapFeatureType(this.actor.system.domainCards.loadout, SYSTEM.DOMAIN.cardTypes);
//         const vault = await this.mapFeatureType(this.actor.system.domainCards.vault, SYSTEM.DOMAIN.cardTypes);
//         context.abilities = {
//             foundation: foundation,
//             loadout: {
//                 top: loadout.slice(0, Math.min(2, nrLoadoutCards)),
//                 bottom: nrLoadoutCards > 2 ? loadout.slice(2, Math.min(5, nrLoadoutCards)) : [],
//                 nrTotal: nrLoadoutCards,
//             },
//             vault: vault.map(x => ({ ...x, uuid: x.uuid, sendToLoadoutDisabled: this.actor.system.domainCards.loadout.length >= this.actor.system.domainData.maxLoadout }))
//         };

//         context.inventory = {
//             consumable: {
//                 titles: {
//                     name: game.i18n.localize("DAGGERHEART.Sheets.PC.InventoryTab.ConsumableTitle"),
//                     quantity: game.i18n.localize("DAGGERHEART.Sheets.PC.InventoryTab.QuantityTitle"),
//                 },
//                 items: this.actor.items.filter(x => x.type === 'consumable'),
//             },
//             miscellaneous: {
//                 titles: {
//                     name: game.i18n.localize("DAGGERHEART.Sheets.PC.InventoryTab.MiscellaneousTitle"),
//                     quantity: game.i18n.localize("DAGGERHEART.Sheets.PC.InventoryTab.QuantityTitle"),
//                 },
//                 items: this.actor.items.filter(x => x.type === 'miscellaneous'),
//             },
//         }

//         if(context.inventory.length === 0){
//             context.inventory = Array(1).fill(Array(5).fill([]));
//         }

//         context.classFeatures = (this.multiclassFeatureSetSelected ? this.actor.system.multiclassFeatures : this.actor.system.classFeatures).map(x => {
//             if(x.system.featureType.type !== 'dice'){
//                 return x;
//             }

//             return { ...x, uuid: x.uuid, system: { ...x.system, featureType: { ...x.system.featureType, data: { ...x.system.featureType.data, property: this.actor.system.subclass ? SYSTEM.ACTOR.featureProperties[x.system.featureType.data.property].path(this.actor) : 0 }}}};
//         });

//         return context;
//     }

//     activateListeners(html) {
//         super.activateListeners(html);

//         html.find(".attribute-value").on("change", this.attributeChange.bind(this));
//         html.on('click', '.tab-selector', this.tabSwitch.bind(this));
//         html.on('click', '.level-title.levelup', this.openLevelUp.bind(this));
//         html.find(".feature-input").on("change", this.onFeatureInputBlur.bind(this));
//         html.find(".experience-description").on("change", this.experienceDescriptionChange.bind(this));
//         html.find(".experience-value").on("change", this.experienceValueChange.bind(this));
//         html.on("change", "[data-item]", this.itemUpdate.bind(this));
//     }

//     async _handleAction(action, event, button) {
//         switch(action){
//             case 'toggleEditAttributes':
//                 this.toggleEditAttributes();
//                 break;
//             case 'attributeRoll':
//                 await this.rollAttribute(event);
//                 break;
//             case 'toggleMarks':
//                 await this.toggleMarks(button);
//                 break;
//             case 'toggleAttributeMark':
//                 await this.toggleAttributeMark(button);
//                 break;
//             case 'toggleHP':
//                 await this.toggleHP(button);
//                 break;
//             case 'toggleStress':
//                 await this.toggleStress(button);
//                 break;
//             case 'toggleHope':
//                 await this.toggleHope(button);
//                 break;
//             case 'toggleGold':
//                 await this.toggleGold(button);
//                 break;
//             case 'attackRoll':
//                 await this.attackRoll(event);
//                 break;
//             case 'tabToLoadout':
//                 this.domainCardsTab(false);
//                 break;
//             case 'tabToVault':
//                 this.domainCardsTab(true);
//                 break;
//             case 'sendToVault':
//                 await this.moveDomainCard(button, true);
//                 break;
//             case 'sendToLoadout':
//                 await this.moveDomainCard(button, false);
//                 break;
//             case 'useDomainCard':
//                 await this.useDomainCard(button);
//                 break;
//             case 'selectClass':
//                 await this.selectClass();
//                 break;
//             case 'selectSubclass':
//                 await this.selectSubclass();
//                 break;
//             case 'selectAncestry':
//                 await this.selectAncestry();
//                 break;
//             case 'selectCommunity':
//                 await this.selectCommunity();
//                 break;
//             case 'viewObject':
//                 await this.viewObject(button);
//                 break;
//             case 'useFeature':
//                 await this.useFeature(button);
//                 break;
//             case 'takeShortRest':
//                 await this.takeShortRest();
//                 break;
//             case 'takeLongRest':
//                 await this.takeLongRest();
//                 break;
//             case 'removeActiveItem':
//                 await this.removeActiveItem(event);
//                 break;
//             case 'removeInventoryWeapon':
//                 await this.removeInventoryWeapon(event);
//                 break;
//             case 'addMiscItem':
//                 await this.addMiscItem();
//                 break;
//             case 'deleteItem':
//                 await this.deleteItem(button);
//                 break;
//             case 'addScar':
//                 await this.addScar();
//                 break;
//             case 'selectScar':
//                 await this.selectScar(button);
//                 break;
//             case 'deleteScar':
//                 await this.deleteScar(event);
//                 break;
//             case 'makeDeathMove':
//                 await this.makeDeathMove();
//                 break;
//             case 'toggleFeatureDice':
//                 await this.toggleFeatureDice(button);
//                 break;
//             case 'setStoryEditor':
//                 this.setStoryEditor(button);
//                 break;
//             case 'itemQuantityDecrease':
//                 await this.setItemQuantity(button, -1);
//                 break;
//             case 'itemQuantityIncrease':
//                 await this.setItemQuantity(button, 1);
//                 break;
//             case 'useAbility':
//                 await this.useAbility(button);
//                 break;
//             case 'useAdvancementCard':
//                 await this.useAdvancementCard(button);
//                 break;
//             case 'useAdvancementAbility':
//                 await this.useAdvancementAbility(button);
//                 break;
//             case 'selectFeatureSet':
//                 await this.selectFeatureSet(button);
//                 break;
//         }
//     }

//     async attributeChange(event){
//         const path = `system.attributes.${event.currentTarget.dataset.attribute}.data.base`;
//         await this.actor.update({ [path]: event.currentTarget.value });
//     }

//     toggleEditAttributes(){
//         this.editAttributes = !this.editAttributes;
//         this.render();
//     }

//     async rollAttribute(event){
//         const { roll, hope, fear, advantage, disadvantage, modifiers } = await this.actor.dualityRoll({ title: 'Attribute Bonus', value: event.currentTarget.dataset.value }, event.shiftKey);

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'dualityRoll',
//             system: {
//                 roll: roll._formula,
//                 modifiers: modifiers,
//                 hope: hope,
//                 fear: fear,
//                 advantage: advantage,
//                 disadvantage: disadvantage,
//             },
//             user: game.user.id,
//             content: "systems/daggerheart/templates/chat/duality-roll.hbs",
//             rolls: [roll]
//         });

//         await cls.create(msg.toObject());
//     }

//     async toggleMarks(button){
//         const markValue = Number.parseInt(button.dataset.value);
//         const newValue = this.actor.system.armor.system.marks.value >= markValue ? markValue-1 : markValue;
//         await this.actor.system.armor.update({ 'system.marks.value': newValue });
//     }

//     async toggleAttributeMark(button){
//         const attribute = this.actor.system.attributes[button.dataset.attribute];
//         const newMark = this.actor.system.availableAttributeMarks.filter(x => x > Math.max.apply(null, this.actor.system.attributes[button.dataset.attribute].levelMarks)).sort((a, b) => a > b ? 1 : -1)[0];

//         if(attribute.levelMark || !newMark) return;

//         const path = `system.attributes.${button.dataset.attribute}.levelMarks`;
//         await this.actor.update({ [path]: [...attribute.levelMarks, newMark] });
//     }

//     async toggleHP(button){
//         const healthValue = Number.parseInt(button.dataset.value);
//         const newValue = this.actor.system.resources.health.value >= healthValue ? healthValue-1 : healthValue;
//         await this.actor.update({ 'system.resources.health.value': newValue });
//     }

//     async toggleStress(button){
//         const healthValue = Number.parseInt(button.dataset.value);
//         const newValue = this.actor.system.resources.stress.value >= healthValue ? healthValue-1 : healthValue;
//         await this.actor.update({ 'system.resources.stress.value': newValue });
//     }

//     async toggleHope(button){
//         const hopeValue = Number.parseInt(button.dataset.value);
//         const newValue = this.actor.system.resources.hope.value >= hopeValue ? hopeValue-1 : hopeValue;
//         await this.actor.update({ 'system.resources.hope.value': newValue });
//     }

//     async toggleGold(button){
//         const goldValue = Number.parseInt(button.dataset.value);
//         const goldType = button.dataset.type;
//         const newValue = this.actor.system.gold[goldType] >= goldValue ? goldValue-1 : goldValue;

//         const update = `system.gold.${goldType}`;
//         await this.actor.update({ [update]: newValue });
//     }

//     async attackRoll(event){
//         const weapon = await fromUuid(event.currentTarget.dataset.weapon);
//         const damage = {
//                 value: `${this.actor.system.proficiency.value}${weapon.system.damage.value}`,
//                 type: weapon.system.damage.type,
//                 bonusDamage: this.actor.system.bonuses.damage
//         };
//         const modifier = this.actor.system.attributes[weapon.system.trait].data.value;

//         const { roll, hope, fear, advantage, disadvantage, modifiers, bonusDamageString } = await this.actor.dualityRoll({ title: 'Attribute Modifier', value: modifier }, event.shiftKey, damage.bonusDamage);

//         damage.value = damage.value.concat(bonusDamageString);

//         const targets = Array.from(game.user.targets).map(x => ({
//             id: x.id,
//             name: x.actor.name,
//             img: x.actor.img,
//             difficulty: x.actor.system.difficulty,
//             evasion: x.actor.system.evasion,
//         }));

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'dualityRoll',
//             system: {
//                 roll: roll._formula,
//                 modifiers: modifiers,
//                 hope: hope,
//                 fear: fear,
//                 advantage: advantage,
//                 disadvantage: disadvantage,
//                 damage: damage,
//                 targets: targets,
//             },
//             content: "systems/daggerheart/templates/chat/attack-roll.hbs",
//             rolls: [roll]
//         });

//         await cls.create(msg.toObject());
//     }

//     tabSwitch(event){
//         const tab = event.currentTarget.dataset.tab;
//         if(tab !== 'loadout'){
//             this.onVaultTab = false;
//         }

//         this.render();
//     }

//     openLevelUp(event){
//         new DhpLevelup(this.actor).render(true);
//     }

//     domainCardsTab(toVault){
//         this.onVaultTab = toVault;
//         this.render();
//     }

//     async moveDomainCard(button, toVault){
//         if(!toVault && this.actor.system.domainCards.loadout.length >= this.actor.system.domainData.maxLoadout){
//             return;
//         }

//         const card = this.actor.items.find(x => x.uuid === button.dataset.domain);
//         await card.update({ "system.inVault": toVault });
//     }

//     async useDomainCard(button){
//         const card = this.actor.items.find(x => x.uuid === button.dataset.key);

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'abilityUse',
//             user: game.user.id,
//             content: "systems/daggerheart/templates/chat/ability-use.hbs",
//             system: {
//                 title: `${game.i18n.localize("DAGGERHEART.Chat.DomainCard.Title")} - ${capitalize(button.dataset.domain)}`,
//                 img: card.img,
//                 name: card.name,
//                 description: card.system.effect,
//                 actions: card.system.actions,
//             },
//         });

//         cls.create(msg.toObject());
//     }

//     async selectClass(){
//         (await game.packs.get('daggerheart.playtest-classes'))?.render(true);
//     }

//     async selectSubclass(){
//         (await game.packs.get('daggerheart.playtest-subclasses'))?.render(true);
//     }

//     async selectAncestry(){
//         const dialogClosed = new Promise((resolve, _) => {
//             new AncestrySelectionDialog(resolve).render(true);
//           });
//         const result = await dialogClosed;

//         // await this.emulateItemDrop({ type: 'item', data: result });
//         for(var ancestry of this.actor.items.filter(x => x => x.type === 'ancestry')){
//             await ancestry.delete();
//         }

//         const createdItems = [];
//         for(var feature of this.actor.items.filter(x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.ancestry.id)){
//             await feature.delete();
//         }

//         // createdItems.push(...result.data.system.abilities);
//         createdItems.push(result.data);

//         await this.actor.createEmbeddedDocuments('Item', createdItems);

//         // await this.actor.createEmbeddedDocuments("Item", [result.toObject()]);
//         // (await game.packs.get('daggerheart.playtest-ancestries'))?.render(true);
//     }

//     async selectCommunity(){
//         (await game.packs.get('daggerheart.playtest-communities'))?.render(true);;
//     }

//     async viewObject(button){
//         const object = await fromUuid(button.dataset.value);
//         if(!object) return;

//         const tab = button.dataset.tab;
//         if(tab) object.sheet._tabs[0].active = tab;

//         if(object.sheet.editMode) object.sheet.editMode = false;

//         object.sheet.render(true);
//     }

//     async takeShortRest(){
//         await new DhpDowntime(this.actor, true).render(true);
//         await this.minimize();
//     }

//     async takeLongRest(){
//         await new DhpDowntime(this.actor, false).render(true);
//         await this.minimize();
//     }

//     async removeActiveItem(event){
//         event.stopPropagation();
//         const item = await fromUuid(event.currentTarget.dataset.item);
//         await item.delete();
//     }

//     async removeInventoryWeapon(event){
//         event.stopPropagation();
//         const item = await fromUuid(event.currentTarget.dataset.item);
//         await item.delete();
//     }

//     async addMiscItem(){
//         const result = await this.actor.createEmbeddedDocuments("Item", [{
//             name: game.i18n.localize('DAGGERHEART.Sheets.PC.NewItem'),
//             type: 'miscellaneous'
//         }]);

//         await result[0].sheet.render(true);
//     }

//     async addScar(){
//         if(this.actor.system.story.scars.length === 5) return;

//         await this.actor.update({ "system.story.scars": [...this.actor.system.story.scars, { name: game.i18n.localize("DAGGERHEART.Sheets.PC.NewScar"), description: '' }] });
//     }

//     async selectScar(button){
//         this.selectedScar = Number.parseInt(button.dataset.value);
//         this.render();
//     }

//     async deleteScar(event) {
//         event.stopPropagation();
//         await this.actor.update({ "system.story.scars": this.actor.system.story.scars.filter((_, index) => index !== Number.parseInt(event.currentTarget.dataset.scar) ) })
//     }

//     async makeDeathMove() {
//         if(this.actor.system.resources.health.value === this.actor.system.resources.health.max){
//             await new DhpDeathMove(this.actor).render(true);
//             await this.minimize();
//         }
//     }

//     async toggleFeatureDice(button){
//         const index = Number.parseInt(button.dataset.index);
//         const feature = this.actor.system.classFeatures.find(x => x.uuid === button.dataset.feature);
//         const path = `system.featureType.data.numbers.${index}`;
//         if(feature.system.featureType.data.numbers[index]?.used) return;

//         if(Object.keys(feature.system.featureType.data.numbers).length <= index) {
//             const roll = new Roll(feature.system.featureType.data.value);
//             const rollData = await roll.evaluate();
//             const cls = getDocumentClass("ChatMessage");
//             const msg = new cls({
//                 user: game.user.id,
//                 rolls: [roll]
//             });

//             await cls.create(msg.toObject());

//             await feature.update({ [path]: { value: Number.parseInt(rollData.total), used: false } });
//         } else {
//             await Dialog.confirm({
//                 title: game.i18n.localize("Confirm feature use"),
//                 content: `Are you sure you want to use ${feature.name}?`,
//                 yes: async () => {
//                     await feature.update({ [path]: { used: true } });

//                     const cls = getDocumentClass("ChatMessage");
//                     const msg = new cls({
//                         user: game.user.id,
//                         content: await renderTemplate("systems/daggerheart/templates/chat/ability-use.hbs", {
//                             title: game.i18n.localize("DAGGERHEART.Chat.FeatureTitle"),
//                             card: { name: `${feature.name} - Roll Of ${feature.system.featureType.data.numbers[index].value}`, img: feature.img },
//                         }),
//                     });

//                     cls.create(msg.toObject());
//                 },
//                 no: () => { return; },
//                 defaultYes: false
//             });

//         }
//     }

//     async onFeatureInputBlur(event){
//         const feature = this.actor.system.classFeatures.find(x => x.uuid === event.currentTarget.dataset.feature);
//         const value = Number.parseInt(event.currentTarget.value);
//         if(!Number.isNaN(value)) await feature?.update({ "system.featureType.data.value": value });
//     }

//     async experienceDescriptionChange(event){
//         const newExperiences = [...this.actor.system.experiences];
//         newExperiences[event.currentTarget.dataset.index].description = event.currentTarget.value;
//         await this.actor.update({ "system.experiences": newExperiences });
//     }

//     async experienceValueChange(event){
//         const newExperiences = [...this.actor.system.experiences];
//         newExperiences[event.currentTarget.dataset.index].value = event.currentTarget.value;
//         await this.actor.update({ "system.experiences": newExperiences });
//     }

//     setStoryEditor(button) {
//         this.storyEditor = this.storyEditor === button.dataset.value ? null : button.dataset.value;
//         this.render();
//     }

//     async itemUpdate(event){
//         const name = event.currentTarget.dataset.item;
//         const item = await fromUuid($(event.currentTarget).closest('[data-item-id]')[0].dataset.itemId);
//         await item.update({ [name]: event.currentTarget.value });
//     }

//     async deleteItem(button){
//         const item = await fromUuid($(button).closest('[data-item-id]')[0].dataset.itemId);
//         await item.delete();
//     }

//     async setItemQuantity(button, value){
//         const item = await fromUuid($(button).closest('[data-item-id]')[0].dataset.itemId);
//         await item.update({ "system.quantity": Math.max(item.system.quantity + value, 1) });
//     }

//     async useFeature(button) {
//         const item = await fromUuid(button.dataset.id);

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'abilityUse',
//             user: game.user.id,
//             content: "systems/daggerheart/templates/chat/ability-use.hbs",
//             system: {
//                 title: game.i18n.localize("DAGGERHEART.Chat.FeatureTitle"),
//                 img: item.img,
//                 name: item.name,
//                 description: item.system.description,
//                 actions: item.system.actions,
//             },
//         });

//         cls.create(msg.toObject());
//     }

//     async useAbility(button) {
//         const item = await fromUuid(button.dataset.feature);
//         const type = button.dataset.type

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'abilityUse',
//             user: game.user.id,
//             system: {
//                 title: type === 'ancestry' ? game.i18n.localize("DAGGERHEART.Chat.FoundationCard.AncestryTitle") :
//                     type === 'community' ? game.i18n.localize("DAGGERHEART.Chat.FoundationCard.CommunityTitle") :
//                     game.i18n.localize("DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle"),
//                 img: item.img,
//                 name: item.name,
//                 description: item.system.description,
//                 actions: [],
//             },
//             content: "systems/daggerheart/templates/chat/ability-use.hbs",
//         });

//         cls.create(msg.toObject());
//     }

//     async useAdvancementCard(button){
//         const item = button.dataset.multiclass === 'true' ? this.actor.system.multiclassSubclass : this.actor.system.subclass;
//         const ability = item.system[`${button.dataset.key}Feature`];
//         const title = `${item.name} - ${game.i18n.localize(`DAGGERHEART.Sheets.PC.DomainCard.${capitalize(button.dataset.key)}Title`)}`;

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             user: game.user.id,
//             content: await renderTemplate("systems/daggerheart/templates/chat/ability-use.hbs", {
//                 title: game.i18n.localize("DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle"),
//                 card: { name: title, img: item.img, description: ability.description },
//             }),
//         });

//         cls.create(msg.toObject());
//     }

//     async useAdvancementAbility(button){
//         // const item = await fromUuid(button.dataset.id);
//         const item = this.actor.items.find(x => x.uuid === button.dataset.id);

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             user: game.user.id,
//             content: await renderTemplate("systems/daggerheart/templates/chat/ability-use.hbs", {
//                 title: game.i18n.localize("DAGGERHEART.Chat.FoundationCard.SubclassFeatureTitle"),
//                 card: { name: item.name, img: item.img, description: item.system.description },
//             }),
//         });

//         cls.create(msg.toObject());
//     }

//     async selectFeatureSet(button){
//         const multiclass = button.dataset.multiclass === 'true';
//         this.multiclassFeatureSetSelected = multiclass;
//         this.render();
//     }

//     async close(options){
//         this.onVaultTab = false;
//         super.close(options);
//     }

//     async _onDragStart(event){
//         if(event.currentTarget.classList.contains('inventory-item')){
//             if(!['weapon', 'armor'].includes(event.currentTarget.dataset.type)){
//                 return;
//             }

//             const targets = {
//                 'weapon': ['weapon-section', 'inventory-weapon-section'],
//                 'armor': ['armor-section', 'inventory-armor-section'],
//             };

//             event.dataTransfer.setData("text/plain", JSON.stringify({ uuid: event.currentTarget.dataset.item, internal: true, targets: targets[event.currentTarget.dataset.type] }));
//         }

//         super._onDragStart(event);
//     }

//     async _onDrop(event){
//         const itemData = event.dataTransfer?.getData('text/plain');
//         const item = itemData ? JSON.parse(itemData) : null;
//         if (item?.internal){
//             let target = null;
//             event.currentTarget.classList.forEach(x => {
//                 if(item.targets.some(target => target === x)){
//                     target = x;
//                 }
//             });
//             if(target){
//                 const itemObject = await fromUuid(item.uuid);
//                 switch(target){
//                     case 'weapon-section':
//                         if(itemObject.system.secondary && this.actor.system.activeWeapons.burden === 'twoHanded'){
//                             ui.notifications.info(game.i18n.localize("DAGGERHEART.Notification.Info.SecondaryEquipWhileTwohanded"));
//                             return;
//                         }
//                         else if(itemObject.system.burden === 'twoHanded' && this.actor.system.activeWeapons.secondary){
//                             ui.notifications.info(game.i18n.localize("DAGGERHEART.Notification.Info.TwohandedEquipWhileSecondary"));
//                             return;
//                         }

//                         const existingWeapon = this.actor.items.find(x => x.system.active && x.system.secondary === itemObject.system.secondary);
//                         await existingWeapon?.update({ "system.active": false });
//                         await itemObject.update({ "system.active": true });
//                         break;
//                     case 'armor-section':
//                         const existingArmor = this.actor.items.find(x => x.type === 'armor' && x.system.active);
//                         await existingArmor?.update({ "system.active": false });
//                         await itemObject.update({ "system.active": true });
//                         break;
//                     case 'inventory-weapon-section':
//                         const existingInventoryWeapon = this.actor.items.find(x => x.system.inventoryWeapon);
//                         await existingInventoryWeapon?.update({ "system.inventoryWeapon": false });
//                         await itemObject.update({ "system.inventoryWeapon": true });
//                         break;
//                     case 'inventory-armor-section':
//                         const existingInventoryArmor = this.actor.items.find(x => x.system.inventoryArmor);
//                         await existingInventoryArmor?.update({ "system.inventoryArmor": false });
//                         await itemObject.update({ "system.inventoryArmor": true });
//                         break;
//                 }
//             }
//         }
//         else {
//             super._onDrop(event);
//         }
//     }

//     async _onDropItem(event, data){
//         if(this.dropItemBlock){
//             return;
//         }
//         else {
//             this.dropItemBlock = true;
//             setTimeout(() => this.dropItemBlock = false, 500);
//         }

//         const element = event.currentTarget;
//         const item = await Item.implementation.fromDropData(data);
//         const itemData = item.toObject();

//         const createdItems = [];

//         if(item.type === 'domainCard'){
//             if(!this.actor.system.class)
//             {
//                 ui.notifications.error(game.i18n.localize("DAGGERHEART.Notification.Error.NoClassSelected"));
//                 return;
//             }

//             if(!this.actor.system.domains.find(x => x === item.system.domain)){
//                 ui.notifications.error(game.i18n.localize("DAGGERHEART.Notification.Error.LacksDomain"));
//                 return;
//             }

//             if(this.actor.system.domainCards.total.length === this.actor.system.domainData.maxCards){
//                 ui.notifications.error(game.i18n.localize("DAGGERHEART.Notification.Error.MaxLoadoutReached"));
//                 return;
//             }

//             if(this.actor.system.domainCards.total.find(x => x.name === item.name)){
//                 ui.notifications.error(game.i18n.localize("DAGGERHEART.Notification.Error.DuplicateDomainCard"));
//                 return;
//             }

//             if(this.actor.system.domainCards.loadout.length >= this.actor.system.domainData.maxLoadout){
//                 itemData.system.inVault = true;
//             }

//             if ( this.actor.uuid === item.parent?.uuid ) return this._onSortItem(event, itemData);
//             const createdItem = await this._onDropItemCreate(itemData);

//             return createdItem;
//         }
//         else {
//             if(!item.system.multiclass && ['class', 'subclass', 'ancestry', 'community'].includes(item.type)){
//                 const existing = this.actor.items.find(x => x.type === item.type);
//                 await existing?.delete();
//             }

//             if(item.type === 'subclass'){
//                 if(!item.system.multiclass){
//                     if(!this.actor.system.class){
//                         ui.notifications.info(game.i18n.localize("DAGGERHEART.Notification.Info.SelectClassBeforeSubclass"));
//                         return;
//                     }
//                     else if(!this.actor.system.class.system.subclasses.some(x => x.uuid === item.uuid)){
//                         ui.notifications.info(game.i18n.localize("DAGGERHEART.Notification.Info.SubclassNotOfClass"));
//                         return;
//                     }

//                     for(var feature of this.actor.items.filter(x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.subclass.id)){
//                         await feature.delete();
//                     }
//                 }

//                 const features = [itemData.system.foundationFeature, itemData.system.specializationFeature, itemData.system.masteryFeature];
//                 for(var i = 0; i < features.length; i++){
//                     const feature = features[i];
//                     for(var ability of feature.abilities){
//                         const data = (await fromUuid(ability.uuid)).toObject();
//                         if(i > 0 ) data.system.disabled = true;
//                         data.uuid = itemData.uuid;

//                         const abilityData = await this._onDropItemCreate(data);
//                         ability.uuid = abilityData[0].uuid;

//                         createdItems.push(abilityData);
//                     }
//                 }
//             }
//             else if(item.type === 'class'){
//                 if(!item.system.multiclass){
//                     for(var feature of this.actor.items.filter(x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.class.id)){
//                         await feature.delete();
//                     }
//                 }

//                 for(var feature of item.system.features){
//                     const data = (await fromUuid(feature.uuid)).toObject();
//                     const itemData = await this._onDropItemCreate(data);
//                     createdItems.push(itemData);
//                 }
//             }
//             else if(item.type === 'ancestry'){
//                 for(var feature of this.actor.items.filter(x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.ancestry.id)){
//                     await feature.delete();
//                 }

//                 for(var feature of item.system.abilities){
//                     const data = (await fromUuid(feature.uuid)).toObject();
//                     const itemData = await this._onDropItemCreate(data);
//                     createdItems.push(itemData);
//                 }
//             }
//             else if(item.type === 'community'){
//                 for(var feature of this.actor.items.filter(x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.community.id)){
//                     await feature.delete();
//                 }

//                 for(var feature of item.system.abilities){
//                     const data = (await fromUuid(feature.uuid)).toObject();
//                     const itemData = await this._onDropItemCreate(data);
//                     createdItems.push(itemData);
//                 }
//             }

//             if ( this.actor.uuid === item.parent?.uuid ) return this._onSortItem(event, item);

//             if(item.type === 'weapon'){
//                 if(!element) return;

//                 if(element.classList.contains('weapon-section')){
//                     if(item.system.secondary && this.actor.system.activeWeapons.burden === 'twoHanded'){
//                         ui.notifications.info(game.i18n.localize("DAGGERHEART.Notification.Info.SecondaryEquipWhileTwohanded"));
//                         return;
//                     }
//                     else if(item.system.burden === 'twoHanded' && this.actor.system.activeWeapons.secondary){
//                         ui.notifications.info(game.i18n.localize("DAGGERHEART.Notification.Info.TwohandedEquipWhileSecondary"));
//                         return;
//                     }

//                     const existing = this.actor.system.activeWeapons.primary && !item.system.secondary ? await fromUuid(this.actor.system.activeWeapons.primary.uuid) :
//                         this.actor.system.activeWeapons.secondary && item.system.secondary ? await fromUuid(this.actor.system.activeWeapons.secondary.uuid) : null;
//                     await existing?.delete();
//                     itemData.system.active = true;
//                 }
//                 else if(element.classList.contains('inventory-weapon-section-first')){
//                     const existing = this.actor.system.inventoryWeapons.first ? await fromUuid(this.actor.system.inventoryWeapons.first.uuid) : null;
//                     await existing?.delete();

//                     itemData.system.inventoryWeapon = 1;
//                 }
//                 else if(element.classList.contains('inventory-weapon-section-second')){
//                     const existing = this.actor.system.inventoryWeapons.second ? await fromUuid(this.actor.system.inventoryWeapons.second.uuid) : null;
//                     await existing?.delete();

//                     itemData.system.inventoryWeapon = 2;
//                 }
//                 else return [];
//             }

//             if(item.type === 'armor'){
//                 if(!element) return;

//                 if(element.classList.contains('armor-section')){
//                     const existing = this.actor.system.armor ? await fromUuid(this.actor.system.armor.uuid) : null;
//                     await existing?.delete();
//                 }

//                 else return;
//             }

//             const createdItem = await this._onDropItemCreate(itemData);
//             createdItems.push(createdItem);

//             return createdItems;
//         }
//     }

//     async emulateItemDrop(data) {
//         const event = new DragEvent("drop", { altKey: game.keyboard.isModifierActive("Alt") });
//         return this._onDropItem(event, data);
//     }
// }
