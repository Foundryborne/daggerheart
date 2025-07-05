import { abilities } from '../../config/actorConfig.mjs';
import { burden } from '../../config/generalConfig.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhCharacterCreation extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(character) {
        super({});

        this.character = character;

        this.setup = {
            traits: this.character.system.traits,
            ancestry: this.character.system.ancestry ?? {},
            community: this.character.system.community ?? {},
            class: this.character.system.class?.value ?? {},
            subclass: this.character.system.class?.subclass ?? {},
            experiences: {
                [foundry.utils.randomID()]: { description: '', value: 2 },
                [foundry.utils.randomID()]: { description: '', value: 2 }
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
    }

    get title() {
        return game.i18n.format('DAGGERHEART.CharacterCreation.Title', { actor: this.character.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'character-creation'],
        position: { width: 800, height: 'auto' },
        actions: {
            viewCompendium: this.viewCompendium,
            viewItem: this.viewItem,
            useSuggestedTraits: this.useSuggestedTraits,
            equipmentChoice: this.equipmentChoice,
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
        setup: { template: 'systems/daggerheart/templates/characterCreation/tabs/setup.hbs' },
        equipment: { template: 'systems/daggerheart/templates/characterCreation/tabs/equipment.hbs' },
        // story: { template: 'systems/daggerheart/templates/characterCreation/tabs/story.hbs' },
        footer: { template: 'systems/daggerheart/templates/characterCreation/footer.hbs' }
    };

    static TABS = {
        setup: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'setup',
            label: 'DAGGERHEART.CharacterCreation.Tabs.Setup'
        },
        equipment: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'equipment',
            label: 'DAGGERHEART.CharacterCreation.Tabs.Equipment',
            optional: true
        }
        // story: {
        //     active: false,
        //     cssClass: '',
        //     group: 'primary',
        //     id: 'story',
        //     label: 'DAGGERHEART.CharacterCreation.Tabs.Story',
        //     optional: true
        // }
    };

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';

            switch (v.id) {
                case 'setup':
                    const classFinished = this.setup.class.uuid && this.setup.subclass.uuid;
                    const heritageFinished = this.setup.ancestry.uuid && this.setup.community.uuid;
                    const traitsFinished = Object.values(this.setup.traits).every(x => x.value !== null);
                    const experiencesFinished = Object.values(this.setup.experiences).every(x => x.description);
                    const domainCardsFinished = Object.values(this.setup.domainCards).every(x => x.uuid);
                    v.finished =
                        classFinished &&
                        heritageFinished &&
                        traitsFinished &&
                        experiencesFinished &&
                        domainCardsFinished;
                    break;
                case 'equipment':
                    const armorFinished = this.equipment.armor?.uuid;
                    const primaryFinished = this.equipment.primaryWeapon?.uuid;
                    const secondaryFinished =
                        this.equipment.secondaryWeapon?.uuid ||
                        (primaryFinished && this.equipment.primaryWeapon.system.burden == burden.twoHanded.value);
                    const choiceAFinished = this.equipment.inventory.choiceA?.uuid;
                    const choiceBFinished = this.equipment.inventory.choiceB?.uuid;

                    v.finished =
                        armorFinished && primaryFinished && secondaryFinished && choiceAFinished && choiceBFinished;
            }
        }

        tabs.equipment.cssClass = tabs.setup.finished ? tabs.equipment.cssClass : 'disabled';
        // tabs.story.cssClass = tabs.setup.finished ? tabs.story.cssClass : 'disabled';

        return tabs;
    }

    changeTab(tab, group, options) {
        super.changeTab(tab, group, options);

        for (var listTab of Object.keys(this.constructor.TABS)) {
            const marker = options.navElement.querySelector(`a[data-action="tab"].${listTab} .finish-marker`);
            if (listTab === tab) {
                marker.classList.add('active');
            } else {
                marker.classList.remove('active');
            }
        }
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        this._dragDrop.forEach(d => d.bind(htmlElement));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.tabs = this._getTabs(this.constructor.TABS);

        return context;
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'setup':
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
                          return `${game.i18n.localize(`DAGGERHEART.Abilities.${traitKey}.short`)} ${trait > 0 ? `+${trait}` : trait}`;
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
                context.traits.nrSelected = Object.values(context.traits.values).reduce(
                    (acc, trait) => acc + (trait.value !== null ? 1 : 0),
                    0
                );

                context.experience = {
                    values: this.setup.experiences,
                    nrTotal: Object.keys(this.setup.experiences).length,
                    nrSelected: Object.values(this.setup.experiences).reduce(
                        (acc, exp) => acc + (exp.description ? 1 : 0),
                        0
                    )
                };

                context.ancestry = { ...this.setup.ancestry, compendium: 'ancestries' };
                context.community = { ...this.setup.community, compendium: 'communities' };
                context.class = { ...this.setup.class, compendium: 'classes' };
                context.subclass = { ...this.setup.subclass, compendium: 'subclasses' };
                context.domainCards = Object.keys(this.setup.domainCards).reduce((acc, x) => {
                    acc[x] = { ...this.setup.domainCards[x], compendium: 'domains' };
                    return acc;
                }, {});

                context.visibility = this.setup.visibility;
                break;
            case 'equipment':
                const suggestions = await this.getEquipmentSuggestions(
                    this.equipment.inventory.choiceA,
                    this.equipment.inventory.choiceB
                );
                context.armor = {
                    ...this.equipment.armor,
                    suggestion: { ...suggestions.armor, taken: suggestions.armor?.uuid === this.equipment.armor?.uuid },
                    compendium: 'armors'
                };
                context.primaryWeapon = {
                    ...this.equipment.primaryWeapon,
                    suggestion: {
                        ...suggestions.primaryWeapon,
                        taken: suggestions.primaryWeapon?.uuid === this.equipment.primaryWeapon?.uuid
                    },
                    compendium: 'weapons'
                };
                context.secondaryWeapon = {
                    ...this.equipment.secondaryWeapon,
                    suggestion: {
                        ...suggestions.secondaryWeapon,
                        taken: suggestions.secondaryWeapon?.uuid === this.equipment.secondaryWeapon?.uuid
                    },
                    disabled: this.equipment.primaryWeapon?.system?.burden === burden.twoHanded.value,
                    compendium: 'weapons'
                };
                context.inventory = {
                    take: suggestions.inventory.take,
                    choiceA: { suggestions: suggestions.inventory.choiceA, compendium: 'consumables' },
                    choiceB: { suggestions: suggestions.inventory.choiceB, compendium: 'general-items' }
                };

                break;
        }

        return context;
    }

    static async updateForm(event, _, formData) {
        this.setup = foundry.utils.mergeObject(this.setup, formData.object);

        this.setup.visibility = this.getUpdateVisibility();
        this.render();
    }

    getUpdateVisibility() {
        switch (this.setup.visibility) {
            case 5:
                return 5;
            case 4:
                return Object.values(this.setup.experiences).every(x => x.description) ? 5 : 4;
            case 3:
                return Object.values(this.setup.traits).every(x => x.value !== null) ? 4 : 3;
            case 2:
                return this.setup.ancestry.uuid && this.setup.community.uuid ? 3 : 2;
            case 1:
                return this.setup.class.uuid && this.setup.subclass.uuid ? 2 : 1;
        }
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
                take: inventory.take ?? [],
                choiceA:
                    inventory.choiceA?.map(x => ({ ...x, uuid: x.uuid, selected: x.uuid === choiceA?.uuid })) ?? [],
                choiceB: inventory.choiceB?.map(x => ({ ...x, uuid: x.uuid, selected: x.uuid === choiceB?.uuid })) ?? []
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

    static async viewCompendium(_, target) {
        (await game.packs.get(`daggerheart.${target.dataset.compendium}`))?.render(true);
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

    static async finish() {
        await this.character.createEmbeddedDocuments('Item', [this.setup.ancestry]);
        await this.character.createEmbeddedDocuments('Item', [this.setup.community]);
        await this.character.createEmbeddedDocuments('Item', [this.setup.class]);
        await this.character.createEmbeddedDocuments('Item', [this.setup.subclass]);
        await this.character.createEmbeddedDocuments('Item', Object.values(this.setup.domainCards));

        if (this.equipment.armor.uuid)
            await this.character.createEmbeddedDocuments('Item', [
                { ...this.equipment.armor, system: { ...this.equipment.armor.system, equipped: true } }
            ]);
        if (this.equipment.primaryWeapon.uuid)
            await this.character.createEmbeddedDocuments('Item', [
                { ...this.equipment.primaryWeapon, system: { ...this.equipment.primaryWeapon.system, equipped: true } }
            ]);
        if (this.equipment.secondaryWeapon.uuid)
            await this.character.createEmbeddedDocuments('Item', [
                {
                    ...this.equipment.secondaryWeapon,
                    system: { ...this.equipment.secondaryWeapon.system, equipped: true }
                }
            ]);
        if (this.equipment.inventory.choiceA.uuid)
            await this.character.createEmbeddedDocuments('Item', [this.equipment.inventory.choiceA]);
        if (this.equipment.inventory.choiceB.uuid)
            await this.character.createEmbeddedDocuments('Item', [this.equipment.inventory.choiceB]);
        await this.character.createEmbeddedDocuments('Item', this.setup.class.system.inventory.take);

        await this.character.update({
            system: {
                traits: this.setup.traits,
                experiences: this.setup.experiences
            }
        });

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
        if (item.type === 'ancestry' && event.target.closest('.ancestry-card')) {
            this.setup.ancestry = {
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
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.SubclassNotInClass')
                );
                return;
            }

            this.setup.subclass = {
                ...item,
                effects: Array.from(item.effects).map(x => x.toObject()),
                uuid: item.uuid
            };
        } else if (item.type === 'domainCard' && event.target.closest('.domain-card')) {
            if (!this.setup.class.uuid) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.MissingClass'));
                return;
            }

            if (!this.setup.class.system.domains.includes(item.system.domain)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.WrongDomain'));
                return;
            }

            if (item.system.level > 1) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.CardTooHighLevel')
                );
                return;
            }

            if (Object.values(this.setup.domainCards).some(card => card.uuid === item.uuid)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.DuplicateCard'));
                return;
            }

            this.setup.domainCards[event.target.closest('.domain-card').dataset.card] = { ...item, uuid: item.uuid };
        } else if (item.type === 'armor' && event.target.closest('.armor-card')) {
            if (item.system.tier > 1) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.ItemTooHighTier')
                );
                return;
            }

            this.equipment.armor = { ...item, uuid: item.uuid };
        } else if (item.type === 'weapon' && event.target.closest('.primary-weapon-card')) {
            if (item.system.secondary) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.NotPrimary'));
                return;
            }

            if (item.system.tier > 1) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.ItemTooHighTier')
                );
                return;
            }

            this.equipment.primaryWeapon = { ...item, uuid: item.uuid };
        } else if (item.type === 'weapon' && event.target.closest('.secondary-weapon-card')) {
            if (this.equipment.primaryWeapon?.system?.burden === burden.twoHanded.value) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.PrimaryIsTwoHanded')
                );
                return;
            }

            if (!item.system.secondary) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.NotSecondary'));
                return;
            }

            if (item.system.tier > 1) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.CharacterCreation.Notifications.ItemTooHighTier')
                );
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
