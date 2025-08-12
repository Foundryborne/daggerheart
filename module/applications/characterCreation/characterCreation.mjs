import { abilities } from '../../config/actorConfig.mjs';
import { burden } from '../../config/generalConfig.mjs';
import { ItemBrowser } from '../ui/itemBrowser.mjs';
import { createEmbeddedItemsWithEffects, createEmbeddedItemWithEffects } from '../../helpers/utils.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhCharacterCreation extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(character) {
        super({});

        this.character = character;

        this.setup = {
            traits: this.character.system.traits,
            ancestryName: {
                primary: '',
                secondary: ''
            },
            mixedAncestry: false,
            primaryAncestry: this.character.system.ancestry ?? {},
            secondaryAncestry: {},
            community: this.character.system.community ?? {},
            class: this.character.system.class?.value ?? {},
            subclass: this.character.system.class?.subclass ?? {},
            experiences: {
                [foundry.utils.randomID()]: { name: '', value: 2, core: true },
                [foundry.utils.randomID()]: { name: '', value: 2, core: true }
            },
            domainCards: {
                [foundry.utils.randomID()]: {},
                [foundry.utils.randomID()]: {}
            },
            visibility: 1
        };

        this.equipment = {
            armor: {},
            primaryWeapon: {},
            secondaryWeapon: {},
            inventory: {
                take: {},
                choiceA: {},
                choiceB: {}
            }
        };

        this._dragDrop = this._createDragDropHandlers();

        this.itemBrowser = null;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.CharacterCreation.title', { actor: this.character.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'character-creation'],
        position: { width: 700, height: 'auto' },
        actions: {
            viewCompendium: this.viewCompendium,
            viewItem: this.viewItem,
            useSuggestedTraits: this.useSuggestedTraits,
            equipmentChoice: this.equipmentChoice,
            setupGoNext: this.setupGoNext,
            finish: this.finish
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.ancestry-card' },
            { dragSelector: null, dropSelector: '.community-card' },
            { dragSelector: null, dropSelector: '.class-card' },
            { dragSelector: null, dropSelector: '.subclass-card' },
            { dragSelector: null, dropSelector: '.domain-card' },
            { dragSelector: null, dropSelector: '.armor-card' },
            { dragSelector: null, dropSelector: '.primary-weapon-card' },
            { dragSelector: null, dropSelector: '.secondary-weapon-card' },
            { dragSelector: '.suggestion-inner-container', dropSelector: '.selections-container' }
        ]
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/characterCreation/tabs.hbs' },
        ancestry: { template: 'systems/daggerheart/templates/characterCreation/tabs/ancestry.hbs' },
        community: { template: 'systems/daggerheart/templates/characterCreation/tabs/community.hbs' },
        class: { template: 'systems/daggerheart/templates/characterCreation/tabs/class.hbs' },
        traits: { template: 'systems/daggerheart/templates/characterCreation/tabs/traits.hbs' },
        experience: { template: 'systems/daggerheart/templates/characterCreation/tabs/experience.hbs' },
        domainCards: { template: 'systems/daggerheart/templates/characterCreation/tabs/domainCards.hbs' },
        equipment: { template: 'systems/daggerheart/templates/characterCreation/equipment.hbs' },
        // story: { template: 'systems/daggerheart/templates/characterCreation/story.hbs' },
        footer: { template: 'systems/daggerheart/templates/characterCreation/footer.hbs' }
    };

    static TABS = {
        ancestry: {
            active: true,
            cssClass: '',
            group: 'setup',
            id: 'ancestry',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.ancestry'
        },
        community: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'community',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.community'
        },
        class: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'class',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.class'
        },
        traits: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'traits',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.traits'
        },
        experience: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'experience',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.experience'
        },
        domainCards: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'domainCards',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.domainCards'
        },
        equipment: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'equipment',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.equipment'
        }
    };

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group]
                ? this.tabGroups[v.group] === v.id
                : this.tabGroups.primary !== 'equipment'
                  ? v.active
                  : false;
            v.cssClass = v.active ? 'active' : '';

            switch (v.id) {
                case 'community':
                    v.disabled = this.setup.visibility < 2;
                    break;
                case 'class':
                    v.disabled = this.setup.visibility < 3;
                    break;
                case 'traits':
                    v.disabled = this.setup.visibility < 4;
                    break;
                case 'experience':
                    v.disabled = this.setup.visibility < 5;
                    break;
                case 'domainCards':
                    v.disabled = this.setup.visibility < 6;
                    break;
                case 'equipment':
                    v.disabled = this.setup.visibility < 7;
                    break;
            }
        }

        return tabs;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        this._dragDrop.forEach(d => d.bind(htmlElement));

        htmlElement.querySelectorAll('.mixed-ancestry-slider').forEach(element => {
            element.addEventListener('input', this.mixedAncestryToggle.bind(this));
            element.addEventListener('click', this.mixedAncestryToggle.bind(this));
        });
    }

    async _prepareContext(_options) {
        this.tabGroups.setup = this.tabGroups.setup ?? 'ancestry';
        const context = await super._prepareContext(_options);

        context.tabs = this._getTabs(this.constructor.TABS);
        const availableTraitModifiers = game.settings
            .get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew)
            .traitArray.map(trait => ({ key: trait, name: trait }));
        for (let trait of Object.values(this.setup.traits).filter(x => x.value !== null)) {
            const index = availableTraitModifiers.findIndex(x => x.key === trait.value);
            if (index !== -1) {
                availableTraitModifiers.splice(index, 1);
            }
        }

        context.suggestedTraits = this.setup.class.system
            ? Object.keys(this.setup.class.system.characterGuide.suggestedTraits).map(traitKey => {
                  const trait = this.setup.class.system.characterGuide.suggestedTraits[traitKey];
                  return `${game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${traitKey}.short`)} ${trait > 0 ? `+${trait}` : trait}`;
              })
            : [];
        context.traits = {
            values: Object.keys(this.setup.traits).map(traitKey => {
                const trait = this.setup.traits[traitKey];
                const options = [...availableTraitModifiers];
                if (trait.value !== null && !options.some(x => x.key === trait.value))
                    options.push({ key: trait.value, name: trait.value });

                return {
                    ...trait,
                    key: traitKey,
                    name: game.i18n.localize(abilities[traitKey].label),
                    options: options
                };
            })
        };
        context.traits.nrTotal = Object.keys(context.traits.values).length;
        context.traits.nrSelected = this.getNrSelectedTrait();

        context.experience = {
            values: this.setup.experiences,
            nrTotal: Object.keys(this.setup.experiences).length,
            nrSelected: Object.values(this.setup.experiences).reduce((acc, exp) => acc + (exp.name ? 1 : 0), 0)
        };

        context.mixedAncestry = Number(this.setup.mixedAncestry);

        const { primary, secondary, overwrite } = this.setup.ancestryName;
        context.ancestryName = overwrite ?? (primary && secondary ? `${primary}/${secondary}` : primary);
        context.primaryAncestry = { ...this.setup.primaryAncestry, compendium: 'ancestries' };
        context.secondaryAncestry = { ...this.setup.secondaryAncestry, compendium: 'ancestries' };
        context.community = { ...this.setup.community, compendium: 'communities' };
        context.class = { ...this.setup.class, compendium: 'classes' };
        context.subclass = { ...this.setup.subclass, compendium: 'subclasses' };

        const allDomainData = CONFIG.DH.DOMAIN.allDomains();
        context.classDomains = context.class.uuid
            ? context.class.system.domains.map(key => game.i18n.localize(allDomainData[key].label))
            : [];
        context.domainCards = Object.keys(this.setup.domainCards).reduce((acc, x) => {
            acc[x] = { ...this.setup.domainCards[x], compendium: 'domains' };
            return acc;
        }, {});

        context.visibility = this.setup.visibility;

        return context;
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'footer':
                context.isLastTab = this.tabGroups.setup === 'equipment';
                switch (this.tabGroups.setup) {
                    case null:
                    case 'ancestry':
                        context.nextDisabled = this.setup.visibility === 1;
                        break;
                    case 'community':
                        context.nextDisabled = this.setup.visibility === 2;
                        break;
                    case 'class':
                        context.nextDisabled = this.setup.visibility === 3;
                        break;
                    case 'traits':
                        context.nextDisabled = this.setup.visibility === 4;
                        break;
                    case 'experience':
                        context.nextDisabled = this.setup.visibility === 5;
                        break;
                    case 'domainCards':
                        context.nextDisabled = this.setup.visibility === 6;
                        break;
                }

                break;
            case 'equipment':
                const suggestions = await this.getEquipmentSuggestions(
                    this.equipment.inventory.choiceA,
                    this.equipment.inventory.choiceB
                );
                context.armor = {
                    ...this.equipment.armor,
                    suggestion: {
                        ...suggestions.armor,
                        uuid: suggestions.armor?.uuid,
                        taken: suggestions.armor?.uuid === this.equipment.armor?.uuid
                    },
                    compendium: 'armor'
                };
                context.primaryWeapon = {
                    ...this.equipment.primaryWeapon,
                    suggestion: {
                        ...suggestions.primaryWeapon,
                        uuid: suggestions.primaryWeapon?.uuid,
                        taken: suggestions.primaryWeapon?.uuid === this.equipment.primaryWeapon?.uuid
                    },
                    compendium: 'weapon'
                };
                context.secondaryWeapon = {
                    ...this.equipment.secondaryWeapon,
                    suggestion: {
                        ...suggestions.secondaryWeapon,
                        uuid: suggestions.secondaryWeapon?.uuid,
                        taken: suggestions.secondaryWeapon?.uuid === this.equipment.secondaryWeapon?.uuid
                    },
                    disabled: this.equipment.primaryWeapon?.system?.burden === burden.twoHanded.value,
                    compendium: 'weapon'
                };
                context.inventory = {
                    take: suggestions.inventory.take,
                    choiceA: { suggestions: suggestions.inventory.choiceA, compendium: 'consumables' },
                    choiceB: { suggestions: suggestions.inventory.choiceB, compendium: 'general-items' }
                };
                context.noInventoryChoices =
                    suggestions.inventory.take.length === 0 &&
                    suggestions.inventory.choiceA?.length === 0 &&
                    suggestions.inventory.choiceB?.length === 0;

                break;
        }

        return context;
    }

    static async updateForm(event, _, formData) {
        this.setup = foundry.utils.mergeObject(this.setup, formData.object);

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    mixedAncestryToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        this.setup.mixedAncestry = !this.setup.mixedAncestry;
        if (!this.setup.mixedAncestry) this.setup.secondaryAncestry = {};

        this.render();
    }

    getUpdateVisibility() {
        switch (this.setup.visibility) {
            case 7:
                return 7;
            case 6:
                return Object.values(this.setup.domainCards).every(x => x.uuid) ? 7 : 6;
            case 5:
                return Object.values(this.setup.experiences).every(x => x.name) ? 6 : 5;
            case 4:
                return this.getNrSelectedTrait() === 6 ? 5 : 4;
            case 3:
                return this.setup.class.uuid && this.setup.subclass.uuid ? 4 : 3;
            case 2:
                return this.setup.community.uuid ? 3 : 2;
            case 1:
                return this.setup.primaryAncestry.uuid ? 2 : 1;
        }
    }

    getNrSelectedTrait() {
        const traitCompareArray = [
            ...game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).traitArray
        ];
        return Object.values(this.setup.traits).reduce((acc, x) => {
            const index = traitCompareArray.indexOf(x.value);
            traitCompareArray.splice(index, 1);
            acc += index !== -1;
            return acc;
        }, 0);
    }

    async getEquipmentSuggestions(choiceA, choiceB) {
        if (!this.setup.class.uuid) return { inventory: { take: [] } };

        const { inventory, characterGuide } = this.setup.class.system;
        return {
            armor: characterGuide.suggestedArmor ?? null,
            primaryWeapon: characterGuide.suggestedPrimaryWeapon ?? null,
            secondaryWeapon: characterGuide.suggestedSecondaryWeapon
                ? { ...characterGuide.suggestedSecondaryWeapon, uuid: characterGuide.suggestedSecondaryWeapon.uuid }
                : null,
            inventory: {
                take: inventory.take?.filter(x => x) ?? [],
                choiceA:
                    inventory.choiceA
                        ?.filter(x => x)
                        .map(x => ({ ...x, uuid: x.uuid, selected: x.uuid === choiceA?.uuid })) ?? [],
                choiceB:
                    inventory.choiceB
                        ?.filter(x => x)
                        .map(x => ({ ...x, uuid: x.uuid, selected: x.uuid === choiceB?.uuid })) ?? []
            }
        };
    }

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    static async viewCompendium(event, target) {
        const type = target.dataset.compendium ?? target.dataset.type,
            equipment = ['armor', 'weapon'];

        const presets = {
            compendium: 'daggerheart',
            folder: equipment.includes(type) ? 'equipments' : type,
            render: {
                noFolder: true
            }
        };

        if (type == 'domains')
            presets.filter = {
                'level.max': { key: 'level.max', value: 1 },
                'system.domain': { key: 'system.domain', value: this.setup.class?.system.domains ?? null }
            };

        if (equipment.includes(type))
            presets.filter = {
                'system.tier': { key: 'system.tier', value: 1 },
                'type': { key: 'type', value: type }
            };

        return (this.itemBrowser = await new ItemBrowser({ presets }).render({ force: true }));
    }

    static async viewItem(_, target) {
        (await foundry.utils.fromUuid(target.dataset.uuid)).sheet.render(true);
    }

    static useSuggestedTraits() {
        this.setup.traits = Object.keys(this.setup.traits).reduce((acc, traitKey) => {
            acc[traitKey] = {
                ...this.setup.traits[traitKey],
                value: this.setup.class.system.characterGuide.suggestedTraits[traitKey]
            };
            return acc;
        }, {});

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    static async equipmentChoice(_, target) {
        this.equipment.inventory[target.dataset.path] = await foundry.utils.fromUuid(target.dataset.uuid);
        this.render();
    }

    static setupGoNext() {
        switch (this.setup.visibility) {
            case 2:
                this.tabGroups.setup = 'community';
                break;
            case 3:
                this.tabGroups.setup = 'class';
                break;
            case 4:
                this.tabGroups.setup = 'traits';
                break;
            case 5:
                this.tabGroups.setup = 'experience';
                break;
            case 6:
                this.tabGroups.setup = 'domainCards';
                break;
            case 7:
                this.tabGroups.setup = 'equipment';
                break;
        }

        this.render();
    }

    static async finish() {
        const primaryAncestryFeature = this.setup.primaryAncestry.system.primaryFeature;
        const secondaryAncestryFeature = this.setup.secondaryAncestry?.uuid
            ? this.setup.secondaryAncestry.system.secondaryFeature
            : this.setup.primaryAncestry.system.secondaryFeature;

        const { primary, secondary, overwrite } = this.setup.ancestryName;
        const ancestry = {
            ...this.setup.primaryAncestry,
            name: overwrite ?? (primary && secondary ? `${primary}/${secondary}` : primary),
            system: {
                ...this.setup.primaryAncestry.system,
                features: [
                    { type: 'primary', item: primaryAncestryFeature.uuid },
                    { type: 'secondary', item: secondaryAncestryFeature.uuid }
                ]
            }
        };

        await createEmbeddedItemWithEffects(this.character, ancestry);
        await createEmbeddedItemWithEffects(this.character, this.setup.community);
        await createEmbeddedItemWithEffects(this.character, this.setup.class);
        await createEmbeddedItemWithEffects(this.character, this.setup.subclass);
        await createEmbeddedItemsWithEffects(this.character, Object.values(this.setup.domainCards));

        if (this.equipment.armor.uuid)
            await createEmbeddedItemWithEffects(this.character, this.equipment.armor, {
                ...this.equipment.armor,
                system: { ...this.equipment.armor.system, equipped: true }
            });
        if (this.equipment.primaryWeapon.uuid)
            await createEmbeddedItemWithEffects(this.character, this.equipment.primaryWeapon, {
                ...this.equipment.primaryWeapon,
                system: { ...this.equipment.primaryWeapon.system, equipped: true }
            });
        if (this.equipment.secondaryWeapon.uuid)
            await createEmbeddedItemWithEffects(this.character, this.equipment.secondaryWeapon, {
                ...this.equipment.secondaryWeapon,
                system: { ...this.equipment.secondaryWeapon.system, equipped: true }
            });
        if (this.equipment.inventory.choiceA.uuid)
            await createEmbeddedItemWithEffects(this.character, this.equipment.inventory.choiceA);
        if (this.equipment.inventory.choiceB.uuid)
            await createEmbeddedItemWithEffects(this.character, this.equipment.inventory.choiceB);

        await createEmbeddedItemsWithEffects(
            this.character,
            this.setup.class.system.inventory.take.filter(x => x)
        );

        await this.character.update(
            {
                system: {
                    traits: this.setup.traits,
                    experiences: {
                        ...this.setup.experiences,
                        ...Object.keys(this.character.system.experiences).reduce((acc, key) => {
                            acc[`-=${key}`] = null;
                            return acc;
                        }, {})
                    }
                }
            },
            { overwrite: true }
        );

        if (this.itemBrowser) this.itemBrowser.close();
        this.close();
    }

    async _onDragStart(event) {
        const target = event.currentTarget;

        event.dataTransfer.setData('text/plain', JSON.stringify(target.dataset));
        event.dataTransfer.setDragImage(target, 60, 0);
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const item = await foundry.utils.fromUuid(data.uuid);
        if (item.type === 'ancestry' && event.target.closest('.primary-ancestry-card')) {
            this.setup.ancestryName.primary = item.name;
            this.setup.primaryAncestry = {
                ...item,
                effects: Array.from(item.effects).map(x => x.toObject()),
                uuid: item.uuid
            };
        } else if (item.type === 'ancestry' && event.target.closest('.secondary-ancestry-card')) {
            this.setup.ancestryName.secondary = item.name;
            this.setup.secondaryAncestry = {
                ...item,
                effects: Array.from(item.effects).map(x => x.toObject()),
                uuid: item.uuid
            };
        } else if (item.type === 'community' && event.target.closest('.community-card')) {
            this.setup.community = {
                ...item,
                effects: Array.from(item.effects).map(x => x.toObject()),
                uuid: item.uuid
            };
        } else if (item.type === 'class' && event.target.closest('.class-card')) {
            this.setup.class = { ...item, effects: Array.from(item.effects).map(x => x.toObject()), uuid: item.uuid };
            this.setup.subclass = {};
            this.setup.domainCards = {
                [foundry.utils.randomID()]: {},
                [foundry.utils.randomID()]: {}
            };
        } else if (item.type === 'subclass' && event.target.closest('.subclass-card')) {
            if (this.setup.class.system.subclasses.every(subclass => subclass.uuid !== item.uuid)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.subclassNotInClass'));
                return;
            }

            this.setup.subclass = {
                ...item,
                effects: Array.from(item.effects).map(x => x.toObject()),
                uuid: item.uuid
            };
        } else if (item.type === 'domainCard' && event.target.closest('.domain-card')) {
            if (!this.setup.class.uuid) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.missingClass'));
                return;
            }

            if (!this.setup.class.system.domains.includes(item.system.domain)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.wrongDomain'));
                return;
            }

            if (item.system.level > 1) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.cardTooHighLevel'));
                return;
            }

            if (Object.values(this.setup.domainCards).some(card => card.uuid === item.uuid)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.duplicateCard'));
                return;
            }

            this.setup.domainCards[event.target.closest('.domain-card').dataset.card] = { ...item, uuid: item.uuid };
        } else if (item.type === 'armor' && event.target.closest('.armor-card')) {
            if (item.system.tier > 1) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.itemTooHighTier'));
                return;
            }

            this.equipment.armor = { ...item, uuid: item.uuid };
        } else if (item.type === 'weapon' && event.target.closest('.primary-weapon-card')) {
            if (item.system.secondary) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.notPrimary'));
                return;
            }

            if (item.system.tier > 1) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.itemTooHighTier'));
                return;
            }

            if (item.system.burden === CONFIG.DH.GENERAL.burden.twoHanded.value) {
                this.equipment.secondaryWeapon = {};
            }

            this.equipment.primaryWeapon = { ...item, uuid: item.uuid };
        } else if (item.type === 'weapon' && event.target.closest('.secondary-weapon-card')) {
            if (this.equipment.primaryWeapon?.system?.burden === burden.twoHanded.value) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.primaryIsTwoHanded'));
                return;
            }

            if (!item.system.secondary) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.notSecondary'));
                return;
            }

            if (item.system.tier > 1) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.itemTooHighTier'));
                return;
            }

            this.equipment.secondaryWeapon = { ...item, uuid: item.uuid };
        } else {
            return;
        }

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }
}
