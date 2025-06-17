import { abilities } from '../config/actorConfig.mjs';

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
            }
        };
        this.visibility = 5;

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
            useSuggestedTraits: this.useSuggestedTraits,
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
            { dragSelector: null, dropSelector: '.domain-card' }
        ]
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/views/characterCreation/tabs.hbs' },
        setup: { template: 'systems/daggerheart/templates/views/characterCreation/tabs/setup.hbs' },
        equipment: { template: 'systems/daggerheart/templates/views/characterCreation/tabs/equipment.hbs' },
        story: { template: 'systems/daggerheart/templates/views/characterCreation/tabs/story.hbs' },
        footer: { template: 'systems/daggerheart/templates/views/characterCreation/footer.hbs' }
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
        },
        story: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'story',
            label: 'DAGGERHEART.CharacterCreation.Tabs.Story',
            optional: true
        }
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
            }
        }

        tabs.equipment.cssClass = tabs.setup.finished ? tabs.equipment.cssClass : 'disabled';
        tabs.story.cssClass = tabs.setup.finished ? tabs.story.cssClass : 'disabled';

        return tabs;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        this._dragDrop.forEach(d => d.bind(htmlElement));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.tabs = this._getTabs(this.constructor.TABS);

        const availableTraitModifiers = game.settings
            .get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew)
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
            nrSelected: Object.values(this.setup.experiences).reduce((acc, exp) => acc + (exp.description ? 1 : 0), 0)
        };

        context.ancestry = { ...this.setup.ancestry, compendium: 'ancestries' };
        context.community = { ...this.setup.community, compendium: 'communities' };
        context.class = { ...this.setup.class, compendium: 'classes' };
        context.subclass = { ...this.setup.subclass, compendium: 'subclasses' };
        context.domainCards = Object.keys(this.setup.domainCards).reduce((acc, x) => {
            acc[x] = { ...this.setup.domainCards[x], compendium: 'domains' };
            return acc;
        }, {});

        context.visibility = this.visibility;

        return context;
    }

    static async updateForm(event, _, formData) {
        this.setup = foundry.utils.mergeObject(this.setup, formData.object);

        this.visibility = this.getUpdateVisibility();
        this.render();
    }

    getUpdateVisibility() {
        switch (this.visibility) {
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

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    static async viewCompendium(_, target) {
        (await game.packs.get(`daggerheart.${target.dataset.compendium}`))?.render(true);
    }

    static useSuggestedTraits() {
        this.setup.traits = Object.keys(this.setup.traits).reduce((acc, traitKey) => {
            acc[traitKey] = {
                ...this.setup.traits[traitKey],
                value: this.setup.class.system.characterGuide.suggestedTraits[traitKey]
            };
            return acc;
        }, {});
        this.render();
    }

    static async finish() {
        const embeddedAncestries = await this.character.createEmbeddedDocuments('Item', [this.setup.ancestry]);
        const embeddedCommunities = await this.character.createEmbeddedDocuments('Item', [this.setup.community]);
        await this.character.createEmbeddedDocuments('Item', [this.setup.class]);
        await this.character.createEmbeddedDocuments('Item', [this.setup.subclass]);
        await this.character.createEmbeddedDocuments('Item', Object.values(this.setup.domainCards));

        await this.character.update({
            system: {
                traits: this.setup.traits,
                experiences: this.setup.experiences,
                ancestry: embeddedAncestries[0].uuid,
                community: embeddedCommunities[0].uuid
            }
        });

        this.close();
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await foundry.utils.fromUuid(data.uuid);
        if (item.type === 'ancestry' && event.target.closest('.ancestry-card')) {
            this.setup.ancestry = { ...item, uuid: item.uuid };
        } else if (item.type === 'community' && event.target.closest('.community-card')) {
            this.setup.community = { ...item, uuid: item.uuid };
        } else if (item.type === 'class' && event.target.closest('.class-card')) {
            this.setup.class = { ...item, uuid: item.uuid };
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

            this.setup.subclass = { ...item, uuid: item.uuid };
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
        } else {
            return;
        }

        this.visibility = this.getUpdateVisibility();
        this.render();
    }
}
