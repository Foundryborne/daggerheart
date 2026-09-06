import { abilities } from '../../config/actorConfig.mjs';
import { burden } from '../../config/generalConfig.mjs';
import { RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';
import { ItemBrowser } from '../ui/itemBrowser.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhCharacterCreation extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(character) {
        super({});

        this.character = character;

        this.setup = {
            traits: Object.keys(this.character.system.traits).reduce((acc, key) => {
                acc[key] = { value: null };
                return acc;
            }, {}),
            ancestryName: {
                primary: '',
                secondary: ''
            },
            mixedAncestry: false,
            mixedFeatures: {
                primaryFeature: {},
                secondaryFeature: {}
            },
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

        this.subclassGroups = [];
        this.ancestryGroups = {};
        this.communityGroups = {};
        this.domainCardGroups = {
            label: '',
            items: []
        };

        this.equipmentGroups = {
            primaryWeapon: {
                label: '',
                items: [],
                columns: []
            },
            secondaryWeapon: {
                label: '',
                items: [],
                columns: []
            },
            armor: {
                label: '',
                items: [],
                columns: []
            },
            selectedTable: 'primaryWeapon'
        }

        this.selectedTable = {}

        this.setupHooks = Hooks.on(socketEvent.Refresh, ({ refreshType }) => {
            if (refreshType === RefreshType.CompendiumBrowser) {
                if (this.rendered) {
                    this.render();
                    this.loadItems();
                }
            }
        });
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.CharacterCreation.title', { actor: this.character.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'character-creation'],
        position: { width: 'auto', height: 'auto' },
        window: {
            icon: 'fa-solid fa-wand-magic-sparkles',
            positioned: false,
            resizable: false,
            minimizable: false
        },
        actions: {
            viewCompendium: this.viewCompendium,
            useSuggestedTraits: this.useSuggestedTraits,
            equipmentChoice: this.equipmentChoice,
            setupGoNext: this.setupGoNext,
            finish: this.finish,
            selectItem: this.selectItem,
            selectTable: this.selectTable,
            applySuggestedEquips: this.applySuggestedEquips,
            removeSelectedItem: this.removeSelectedItem,
            mixedAncestryToggle: this.mixedAncestryToggle,
            selectAncestryFeature: this.selectAncestryFeature
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/characterCreation/tabs.hbs' },
        class: { template: 'systems/daggerheart/templates/characterCreation/tabs/class.hbs' },
        ancestry: { template: 'systems/daggerheart/templates/characterCreation/tabs/ancestry.hbs' },
        community: { template: 'systems/daggerheart/templates/characterCreation/tabs/community.hbs' },
        traits: { template: 'systems/daggerheart/templates/characterCreation/tabs/traits.hbs' },
        experience: { template: 'systems/daggerheart/templates/characterCreation/tabs/experience.hbs' },
        domainCards: { template: 'systems/daggerheart/templates/characterCreation/tabs/domainCards.hbs' },
        equipment: { template: 'systems/daggerheart/templates/characterCreation/tabs/equipment.hbs' },
        footer: { template: 'systems/daggerheart/templates/characterCreation/footer.hbs' }
    };

    static TABS = {
        class: {
            active: false,
            cssClass: '',
            group: 'setup',
            id: 'class',
            label: 'DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.class'
        },
        ancestry: {
            active: false,
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
                case 'ancestry':
                    v.disabled = this.setup.visibility < 2;
                    break;
                case 'community':
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

    async _prepareContext(_options) {
        this.tabGroups.setup = this.tabGroups.setup ?? 'class';
        const context = await super._prepareContext(_options);

        context.config = CONFIG.DH;

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
                    verbs: [...abilities[traitKey].verbs],
                    options: options,
                    description: game.i18n.localize(abilities[traitKey].description)
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

        context.mixedAncestry = this.setup.mixedAncestry;

        const { primary, secondary, overwrite } = this.setup.ancestryName;
        context.ancestryName = overwrite ?? (primary && secondary ? `${primary}/${secondary}` : primary);
        context.primaryAncestry = { ...this.setup.primaryAncestry };
        context.secondaryAncestry = { ...this.setup.secondaryAncestry };
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
        context.selectedDomainCards = Object.values(context.domainCards).filter(card => card.name).length;
        context.totalDomainCards = Object.keys(context.domainCards).length;

        context.visibility = this.setup.visibility;

        context.subclassGroups = this.subclassGroups;
        context.ancestryGroups = this.ancestryGroups;
        context.communityGroups = this.communityGroups;
        context.domainCardGroups = this.domainCardGroups;
        context.equipmentGroups = this.equipmentGroups;
        context.selectedTable = this.selectedTable;

        context.mixedFeatures = this.setup.mixedFeatures;

        context.formatLabel = this.formatLabel;

        return context;
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'footer':
                context.isLastTab = this.tabGroups.setup === 'equipment';
                switch (this.tabGroups.setup) {
                    case null:
                    case 'class':
                        context.nextDisabled = this.setup.visibility === 1;
                        break;
                    case 'ancestry':
                        context.nextDisabled = this.setup.visibility === 2;
                        break;
                    case 'community':
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

    static async mixedAncestryToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        this.setup.mixedAncestry = !this.setup.mixedAncestry;
        if (!this.setup.mixedAncestry) this.setup.secondaryAncestry = {};

        this.render();
    }

    static async selectAncestryFeature(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const uuid = target.dataset.uuid;
        const featureType = target.dataset.featureType;
        const ancestryType = target.dataset.ancestryType;
        const feature = await foundry.utils.fromUuid(uuid);

        if (featureType === 'primary') {
            this.setup.mixedFeatures.primaryFeature = feature;
            this.setup.mixedFeatures.secondaryFeature = ancestryType === 'primary' ? this.setup.secondaryAncestry.system.secondaryFeature : this.setup.primaryAncestry.system.secondaryFeature;
        } else {
            this.setup.mixedFeatures.primaryFeature = ancestryType === 'primary' ? this.setup.secondaryAncestry.system.primaryFeature : this.setup.primaryAncestry.system.primaryFeature;
            this.setup.mixedFeatures.secondaryFeature = feature;
        }

        this.setup.visibility = this.getUpdateVisibility();
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
                return this.setup.community.uuid ? 4 : 3;
            case 2:
                return this.setup.primaryAncestry.uuid ? 3 : 2;
            case 1:
                return this.setup.class.uuid && this.setup.subclass.uuid ? 2 : 1;
        }
    }

    getNrSelectedTrait() {
        const traitCompareArray = [
            ...game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).traitArray
        ];
        return Object.values(this.setup.traits).reduce((acc, x) => {
            const index = traitCompareArray.indexOf(x.value);
            if (index === -1) return acc;

            traitCompareArray.splice(index, 1);
            acc += 1;
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

    static async viewCompendium(event, target) {
        const type = target.dataset.compendium ?? target.dataset.type,
            equipment = ['armor', 'weapon'];

        const presets = {
            folder: equipment.includes(type) ? `equipments.folders.${type}s` : type,
            render: {
                noFolder: true
            }
        };

        if (type === 'domains')
            presets.filter = {
                'level.max': { key: 'level.max', value: 1 },
                'system.domain': { key: 'system.domain', value: this.setup.class?.system.domains ?? null }
            };

        if (type === 'subclasses') {
            const classItem = this.setup.class;
            presets.filter = {
                'system.linkedClass': { key: 'system.linkedClass', value: classItem?.sourceUuid }
            };
        }

        if (equipment.includes(type))
            presets.filter = {
                'system.tier': { key: 'system.tier', value: 1 },
                type: { key: 'type', value: type }
            };

        ui.compendiumBrowser.open(presets);
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
                this.tabGroups.setup = 'ancestry';
                break;
            case 3:
                this.tabGroups.setup = 'community';
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

    static async finish(_, button) {
        button.disabled = true;

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

        // Inner function to create the base item data
        async function createEmbeddedItemData(baseData) {
            const uuid = baseData.uuid ?? baseData._uuid
            const data = baseData instanceof Item ? baseData : await foundry.utils.fromUuid(baseData.uuid) ?? baseData;
            const compendiumSource = uuid.startsWith('Compendium.') ? uuid : baseData._stats?.compendiumSource ?? null;
            return {
                ...baseData,
                id: data.id,
                uuid: uuid,
                _uuid: uuid,
                effects: data.effects?.map(effect => effect.toObject()),
                flags: baseData.flags ?? data.flags,
                _stats: {
                    ...data._stats,
                    compendiumSource,
                    // mutually exclusive with compendiumSource
                    duplicateSource: !compendiumSource && uuid && !uuid.startsWith('Compendium.') ? uuid : null
                }
            };
        }

        // Add the class first. All other items validate it during pre creation
        await this.character.createEmbeddedDocuments('Item', [await createEmbeddedItemData(this.setup.class)]);
        
        // Add the remaining items
        const newItems = [
            await createEmbeddedItemData(ancestry),
            await createEmbeddedItemData(this.setup.community),
            await createEmbeddedItemData(this.setup.subclass),
            ...(await Promise.all(
                Object.values(this.setup.domainCards).map(d => createEmbeddedItemData(d))
            ))
        ];
        if (this.equipment.armor.uuid)
            newItems.push(await createEmbeddedItemData(this.equipment.armor));
        if (this.equipment.primaryWeapon.uuid)
            newItems.push(await createEmbeddedItemData(this.equipment.primaryWeapon));
        if (this.equipment.secondaryWeapon.uuid)
            newItems.push(await createEmbeddedItemData(this.equipment.secondaryWeapon));
        if (this.equipment.inventory.choiceA.uuid)
            newItems.push(await createEmbeddedItemData(this.equipment.inventory.choiceA));
        if (this.equipment.inventory.choiceB.uuid)
            newItems.push(await createEmbeddedItemData(this.equipment.inventory.choiceB));
        for (const item of this.setup.class.system.inventory.take.filter(x => x)) {
            newItems.push(await createEmbeddedItemData(item));
        }

        await this.character.createEmbeddedDocuments('Item', newItems);
        await this.character.update(
            {
                system: {
                    traits: this.setup.traits,
                    experiences: {
                        ...this.setup.experiences,
                        ...Object.keys(this.character.system.experiences).reduce((acc, key) => {
                            acc[`${key}`] = _del;
                            return acc;
                        }, {})
                    }
                }
            },
            { overwrite: true }
        );

        if (ui.compendiumBrowser) ui.compendiumBrowser.close();
        this.close();
    }

    async loadItems() {
        const browserSettings = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.CompendiumBrowserSettings
        );
        const promises = [];

        game.packs.forEach(pack => {
            promises.push(
                // eslint-disable-next-line no-async-promise-executor
                new Promise(async resolve => {
                    const items = await pack.getDocuments({ type__in: this.selectedMenu?.data?.type });
                    resolve(items);
                })
            );
        });

        Promise.all(promises).then(async result => {
            this.items = ItemBrowser.sortBy(
                result.flatMap(r => r).filter(r => !browserSettings.isEntryExcluded.bind(browserSettings)(r)),
                'name'
            );
            const cardTheme =
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).tooltipCardTheme;

            /* If any noticeable slowdown occurs, consider replacing with enriching description on clicking to expand descriptions */
            for (const item of this.items) {
                if (['weapon', 'armor'].includes(item.type)) {
                    item.system.enrichedTags = await foundry.applications.handlebars.renderTemplate(
                        'systems/daggerheart/templates/ui/itemBrowser/item-tags.hbs',
                        { item: item.system }
                    );
                }
            }

            if (this.presets?.filter) {
                Object.entries(this.presets.filter).forEach(([k, v]) => {
                    const filter = this.fieldFilter.find(c => c.name === k);
                    if (filter) filter.value = v.value;
                });
            }

            const subclassGroups = [];

            for (const item of this.items.filter(item => item.system?.linkedClass)) {
                const linkedClass = await foundry.utils.fromUuid(item.system.linkedClass);

                if (
                    subclassGroups.some(classItem => classItem.uuid === item.system.linkedClass)
                ) {} else {
                    if (linkedClass) {
                        subclassGroups.push({
                            label: linkedClass.name.toLowerCase(),
                            uuid: linkedClass.uuid,
                            items: this.items.filter(item => item.system?.linkedClass === linkedClass.uuid)
                        })
                    }
                }
            }

            const ancestryGroups = {
                label: game.i18n.localize('DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.ancestry'),
                items: []
            };
            for (const item of this.items.filter(item => item.type == 'ancestry')) {
                item.embedCard = Array.from(await item.system.toEmbed({ theme: cardTheme })).map(el => el.outerHTML).join('');
                ancestryGroups.items.push(item)
            }

            const communityGroups = {
                label: game.i18n.localize('DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.community'),
                items: []
            };
            for (const item of this.items.filter(item => item.type == 'community')) {
                item.embedCard = Array.from(await item.system.toEmbed({ theme: cardTheme })).map(el => el.outerHTML).join('');
                communityGroups.items.push(item)
            }

            const domainCardGroups = {
                label: game.i18n.localize('DAGGERHEART.APPLICATIONS.CharacterCreation.tabs.domainCards'),
                items: []
            };
            for (const item of this.items.filter(item => item.type == 'domainCard')) {
                item.embedCard = Array.from(await item.system.toEmbed({ theme: cardTheme })).map(el => el.outerHTML).join('');
                domainCardGroups.items.push(item)
            }

            const equipmentGroups = {
                primaryWeapon: {
                    label: game.i18n.localize('DAGGERHEART.ITEMS.Class.guide.suggestedPrimaryWeaponTitle'),
                    items: [],
                    columns: CONFIG.DH.ITEMBROWSER.typeConfig.weapons.columns
                },
                secondaryWeapon: {
                    label: game.i18n.localize('DAGGERHEART.ITEMS.Class.guide.suggestedSecondaryWeaponTitle'),
                    items: [],
                    columns: CONFIG.DH.ITEMBROWSER.typeConfig.weapons.columns
                },
                armor: {
                    label: game.i18n.localize('DAGGERHEART.ITEMS.Class.guide.suggestedArmorTitle'),
                    items: [],
                    columns: CONFIG.DH.ITEMBROWSER.typeConfig.armors.columns
                },
                selectedTable: 'primaryWeapon'
            }

            for (const item of this.items.filter(item => item.type == 'weapon' && item.system.tier === 1)) {
                if (item.system.secondary) {
                    equipmentGroups.secondaryWeapon.items.push(item)
                } else {
                    equipmentGroups.primaryWeapon.items.push(item)
                }
            }
            for (const item of this.items.filter(item => item.type == 'armor' && item.system.tier === 1)) {
                equipmentGroups.armor.items.push(item)
            }

            subclassGroups.sort((a, b) => a.label.localeCompare(b.label))

            if (this.subclassGroups.length) return;

            for (const classItem of subclassGroups) {
                const element = document.createElement('div');
                element.classList.add(classItem.label.toLowerCase(), 'compedium-item')
                const subclassElement = document.createElement('ul');

                let header = document.createElement('h1');
                header.classList.add('subtitle-section')
                header.innerHTML = classItem.label + '<side-line-div></side-line-div>'

                element.appendChild(header)

                const subclassList = await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/characterCreation/partials/sidebar-item.hbs',
                    {
                        items: classItem?.items,
                        action: 'selectItem'
                    }
                );

                subclassElement.innerHTML = subclassList
                element.appendChild(subclassElement)

                this.element.querySelector('.compedium-list').appendChild(element);
            }

            this.subclassGroups = subclassGroups;
            this.ancestryGroups = ancestryGroups;
            this.communityGroups = communityGroups;
            this.domainCardGroups = domainCardGroups;
            this.equipmentGroups = equipmentGroups;
            this.selectedTable = equipmentGroups[equipmentGroups.selectedTable];
        });
    }

    async _preRender(context, options) {
        await super._preRender(context, options);

        if (options.isFirstRender) this.loadItems();
    }

    static async selectItem(_, target) {
        const type = target.dataset.type
        
        switch (type) {
            case 'subclass':
                const subclass = await foundry.utils.fromUuid(target.dataset.uuid);
                const classItem = await foundry.utils.fromUuid(subclass.system?.linkedClass);

                this.setup.class = classItem;
                this.setup.subclass = subclass;
                break;

            case 'ancestry':
                const ancestry = await foundry.utils.fromUuid(target.dataset.uuid);
                if (!this.setup.primaryAncestry.uuid) {
                    this.setup.primaryAncestry = ancestry;
                    this.setup.ancestryName.primary = ancestry.name;
                } else if (
                    this.setup.primaryAncestry.uuid &&
                    this.setup.mixedAncestry &&
                    (ancestry.uuid !== this.setup.primaryAncestry.uuid)
                ) {
                    this.setup.secondaryAncestry = ancestry;
                    this.setup.ancestryName.secondary = ancestry.name;
                } else {
                    this.setup.primaryAncestry = ancestry;
                    this.setup.ancestryName.primary = ancestry.name;
                }
                break;

            case 'community':
                const community = await foundry.utils.fromUuid(target.dataset.uuid);
                this.setup.community = community;
                break;

            case 'domainCard':
                const randomIDs = Object.keys(this.setup.domainCards);
                const domain = await foundry.utils.fromUuid(target.dataset.uuid);

                if (this.setup.domainCards[randomIDs[0]].name) {
                    this.setup.domainCards[randomIDs[1]] = domain;
                } else {
                    this.setup.domainCards[randomIDs[0]] = domain;
                }
                break;

            case 'weapon':
                const weapon = await foundry.utils.fromUuid(target.dataset.itemUuid);

                if (weapon.system.secondary) {
                    if (this.equipment.primaryWeapon?.system?.burden === burden.twoHanded.value) return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.primaryIsTwoHanded'));
                    this.equipment.secondaryWeapon = weapon;
                } else {
                    this.equipment.primaryWeapon = weapon;
                }
                break;

            case 'armor':
                const armor = await foundry.utils.fromUuid(target.dataset.itemUuid);
                this.equipment.armor = armor;

                break;
        }

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    static async applySuggestedEquips(_, target) {
        const suggestions = await this.getEquipmentSuggestions(
            this.equipment.inventory.choiceA,
            this.equipment.inventory.choiceB
        );

        this.equipment.primaryWeapon = suggestions.primaryWeapon
        this.equipment.secondaryWeapon = suggestions.secondaryWeapon
        this.equipment.armor = suggestions.armor

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    static async removeSelectedItem(_, target) {
        const type = target.dataset.type;
        const itemType = target.dataset.itemType;
        const indexID = target.dataset.id;

        switch (itemType) {
            case 'armor':
                if (type === 'primaryWeapon') {
                    this.equipment.primaryWeapon = {}
                } else if (type === 'secondaryWeapon') {
                    this.equipment.secondaryWeapon = {}
                } else {
                    this.equipment.armor = {}
                }
                break;
        
            case 'ancestry':
                if (type === 'primaryAncestry') {
                    this.setup.primaryAncestry = {}
                } else if (type === 'secondaryAncestry') {
                    this.setup.secondaryAncestry = {}
                }
                break;
            
            case 'domainCard':
                this.setup.domainCards[indexID] = {}
                break;
        }


        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    static async selectTable(_, target) {
        const table = target.dataset.table;
        this.equipmentGroups.selectedTable = table;

        this.selectedTable = this.equipmentGroups[table];

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    formatLabel(item, field) {
        const property = foundry.utils.getProperty(item, field.key);
        if (Array.isArray(property)) property.join(', ');
        if (typeof field.format !== 'function') return property ?? '-';
        return game.i18n.localize(field.format(property));
    }
}
