import { abilities } from '../config/actorConfig.mjs';
import { domains } from '../config/domainConfig.mjs';
import { DhLevelup } from '../data/levelup.mjs';
import { tagifyElement } from '../helpers/utils.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhlevelUp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.levelTiers = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers);

        const playerLevelupData = actor.system.levelData;
        this.levelup = new DhLevelup(DhLevelup.initializeData(this.levelTiers, playerLevelupData, actor.system.level));

        this._dragDrop = this._createDragDropHandlers();
    }

    get title() {
        return game.i18n.format('DAGGERHEART.Application.LevelUp.Title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'levelup'],
        position: { width: 1000, height: 'auto' },
        window: {
            resizable: true
        },
        actions: {
            save: this.save,
            viewCompendium: this.viewCompendium,
            selectPreview: this.selectPreview,
            selectDomain: this.selectDomain
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: '.levelup-card-selection .card-preview-container' }]
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        advancements: { template: 'systems/daggerheart/templates/views/levelup/tabs/advancements.hbs' },
        selections: { template: 'systems/daggerheart/templates/views/levelup/tabs/selections.hbs' },
        summary: { template: 'systems/daggerheart/templates/views/levelup/tabs/summary.hbs' }
    };

    static TABS = {
        advancements: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'advancements',
            icon: null,
            label: 'DAGGERHEART.Application.LevelUp.Tabs.advancement'
        },
        selections: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'selections',
            icon: null,
            label: 'DAGGERHEART.Application.LevelUp.Tabs.selections'
        },
        summary: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'summary',
            icon: null,
            label: 'DAGGERHEART.Application.LevelUp.Tabs.summary'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.levelup = this.levelup;
        context.tabs = this._getTabs(this.constructor.TABS);

        return context;
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'selections':
                context.advancementChoices = this.levelup.selectionData.reduce((acc, data) => {
                    const advancementChoice = {
                        ...data,
                        path: `tiers.${data.tier}.levels.${data.level}.optionSelections.${data.optionKey}.${data.checkboxNr}.data`
                    };
                    if (acc[data.type]) acc[data.type].push(advancementChoice);
                    else acc[data.type] = [advancementChoice];

                    return acc;
                }, {});

                const traits = Object.values(context.advancementChoices.trait ?? {});
                context.traits = {
                    values: traits.filter(trait => !trait.locked && trait.data.length > 0).flatMap(trait => trait.data),
                    active: traits.length > 0 && traits.filter(trait => !trait.locked).length > 0
                };

                const experienceIncreases = Object.values(context.advancementChoices.experience ?? {}).filter(
                    x => !x.locked
                );
                context.experienceIncreases = {
                    values: experienceIncreases
                        .filter(trait => !trait.locked && trait.data.length > 0)
                        .flatMap(trait => trait.data),
                    active: experienceIncreases.length > 0
                };

                context.newExperiences = Object.keys(this.levelup.allInitialAchievements).flatMap(level => {
                    const achievement = this.levelup.allInitialAchievements[level];
                    return Object.keys(achievement.newExperiences).map(key => ({
                        ...achievement.newExperiences[key],
                        level: level,
                        key: key
                    }));
                });

                const allDomainCards = {
                    ...context.advancementChoices.domainCard,
                    ...this.levelup.domainCards
                };
                const allDomainCardValues = Object.values(allDomainCards);

                context.domainCards = [];
                for (var domainCard of allDomainCardValues) {
                    if (domainCard.locked) continue;

                    const uuid = domainCard.data?.length > 0 ? domainCard.data[0] : domainCard.uuid;
                    const card = uuid ? await foundry.utils.fromUuid(uuid) : { path: domainCard.path };
                    context.domainCards.push({
                        ...(card.toObject?.() ?? card),
                        emptySubtext: game.i18n.format(
                            'DAGGERHEART.Application.LevelUp.Selections.emptyDomainCardHint',
                            { level: domainCard.level }
                        ),
                        limit: domainCard.level,
                        compendium: 'domains'
                    });
                }

                const subclassSelections = context.advancementChoices.subclass?.flatMap(x => x.data) ?? [];

                const multiclassSubclass = this.actor.system.multiclass?.system?.subclasses?.[0];
                const possibleSubclasses = [
                    this.actor.system.subclass,
                    ...(multiclassSubclass ? [multiclassSubclass] : [])
                ];
                const selectedSubclasses = possibleSubclasses.filter(x => subclassSelections.includes(x.uuid));
                context.subclassCards = [];
                if (context.advancementChoices.subclass?.length > 0) {
                    for (var subclass of possibleSubclasses) {
                        const data = await foundry.utils.fromUuid(subclass.uuid);
                        const selected = selectedSubclasses.some(x => x.uuid === data.uuid);
                        context.subclassCards.push({
                            ...data.toObject(),
                            uuid: data.uuid,
                            disabled:
                                !selected && subclassSelections.length === context.advancementChoices.subclass.length,
                            selected: selected
                        });
                    }
                }

                const multiclasses = Object.values(context.advancementChoices.multiclass ?? {});
                if (multiclasses?.[0]) {
                    const data = multiclasses[0];
                    const path = `tiers.${data.tier}.levels.${data.level}.optionSelections.${data.optionKey}.${data.checkboxNr}`;
                    const multiclass = data.data.length > 0 ? await foundry.utils.fromUuid(data.data[0]) : {};

                    context.multiclass = {
                        ...(multiclass.toObject?.() ?? multiclass),
                        uuid: multiclass.uuid,
                        path: path,
                        domains:
                            multiclass?.system?.domains.map(key => {
                                const domain = domains[key];
                                const alreadySelected = this.actor.system.class.system.domains.includes(key);

                                return {
                                    ...domain,
                                    selected: key === data.secondaryData,
                                    disabled: (data.secondaryData && key !== data.secondaryData) || alreadySelected
                                };
                            }) ?? [],
                        compendium: 'classes',
                        limit: 1
                    };
                }

                break;
            case 'summary':
                const actorArmor = this.actor.system.armor;
                const { current: currentLevel, changed: changedLevel } = this.actor.system.levelData.level;
                const achievementCards = [];
                for (var card of Object.values(this.levelup.domainCards)) {
                    if (card.uuid) {
                        const itemCard = await foundry.utils.fromUuid(card.uuid);
                        achievementCards.push(itemCard);
                    }
                }

                context.achievements = {
                    proficiency: {
                        old: this.actor.system.proficiency.value,
                        new:
                            this.actor.system.proficiency.value +
                            Object.values(this.levelup.allInitialAchievements).reduce(
                                (acc, x) => acc + x.proficiency,
                                0
                            )
                    },
                    damageThresholds: {
                        major: {
                            old: this.actor.system.damageThresholds.major,
                            new: this.actor.system.damageThresholds.major + changedLevel - currentLevel
                        },
                        severe: {
                            old: this.actor.system.damageThresholds.severe,
                            new:
                                this.actor.system.damageThresholds.severe +
                                (actorArmor ? changedLevel - currentLevel : (changedLevel - currentLevel) * 2)
                        },
                        unarmored: !actorArmor
                    },
                    domainCards: {
                        values: achievementCards,
                        shown: achievementCards.length > 0
                    },
                    experiences: {
                        values: Object.values(this.levelup.allInitialAchievements).flatMap(achievements => {
                            return Object.values(achievements.newExperiences).reduce((acc, experience) => {
                                if (experience.name) acc.push(experience);

                                return acc;
                            }, []);
                        })
                    }
                };
                context.achievements.proficiency.shown =
                    context.achievements.proficiency.new > context.achievements.proficiency.old;
                context.achievements.experiences.shown = context.achievements.experiences.values.length > 0;

                const advancementChoices = this.levelup.selectionData.reduce((acc, data) => {
                    const advancementChoice = {
                        ...data,
                        path: `tiers.${data.tier}.levels.${data.level}.optionSelections.${data.optionKey}.${data.checkboxNr}.data`
                    };
                    if (acc[data.type]) acc[data.type].push(advancementChoice);
                    else acc[data.type] = [advancementChoice];

                    return acc;
                }, {});

                const advancementCards = [];
                const cardChoices = advancementChoices.domainCard ?? [];
                for (var card of cardChoices) {
                    if (card.data.length > 0) {
                        for (var data of card.data) {
                            const itemCard = await foundry.utils.fromUuid(data);
                            advancementCards.push(itemCard);
                        }
                    }
                }

                context.advancements = {
                    statistics: {
                        proficiency: {
                            old: context.achievements.proficiency.new,
                            new:
                                context.achievements.proficiency.new +
                                Object.values(advancementChoices.proficiency ?? {}).reduce((acc, x) => acc + x.value, 0)
                        },
                        hitPoints: {
                            old: this.actor.system.resources.hitPoints.max,
                            new:
                                this.actor.system.resources.hitPoints.max +
                                Object.values(advancementChoices.hitPoint ?? {}).reduce((acc, x) => acc + x.value, 0)
                        },
                        stress: {
                            old: this.actor.system.resources.stress.max,
                            new:
                                this.actor.system.resources.stress.max +
                                Object.values(advancementChoices.stress ?? {}).reduce((acc, x) => acc + x.value, 0)
                        },
                        evasion: {
                            old: this.actor.system.evasion.value,
                            new:
                                this.actor.system.evasion.value +
                                Object.values(advancementChoices.evasion ?? {}).reduce((acc, x) => acc + x.value, 0)
                        }
                    },
                    traits: Object.values(advancementChoices.trait ?? {}).flatMap(x =>
                        x.data.map(data => game.i18n.localize(abilities[data].label))
                    ),
                    domainCards: advancementCards,
                    experiences: Object.values(advancementChoices.experience ?? {}).flatMap(x =>
                        x.data.map(data => ({ name: data, modifier: x.value }))
                    )
                };

                context.advancements.statistics.proficiency.shown =
                    context.advancements.statistics.proficiency.new > context.advancements.statistics.proficiency.old;
                context.advancements.statistics.hitPoints.shown =
                    context.advancements.statistics.hitPoints.new > context.advancements.statistics.hitPoints.old;
                context.advancements.statistics.stress.shown =
                    context.advancements.statistics.stress.new > context.advancements.statistics.stress.old;
                context.advancements.statistics.evasion.shown =
                    context.advancements.statistics.evasion.new > context.advancements.statistics.evasion.old;
                context.advancements.statistics.shown =
                    context.advancements.statistics.proficiency.shown ||
                    context.advancements.statistics.hitPoints.shown ||
                    context.advancements.statistics.stress.shown ||
                    context.advancements.statistics.evasion.shown;

                break;
        }

        return context;
    }

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        htmlElement
            .querySelectorAll('.selection-checkbox')
            .forEach(element => element.addEventListener('change', this.selectionClick.bind(this)));

        const traitsTagify = htmlElement.querySelector('.levelup-trait-increases');
        if (traitsTagify) {
            tagifyElement(traitsTagify, abilities, this.tagifyUpdate('trait').bind(this));
        }

        const experienceIncreaseTagify = htmlElement.querySelector('.levelup-experience-increases');
        if (experienceIncreaseTagify) {
            tagifyElement(
                experienceIncreaseTagify,
                this.actor.system.experiences.reduce((acc, experience) => {
                    acc[experience.id] = { label: experience.description };

                    return acc;
                }, {}),
                this.tagifyUpdate('experience').bind(this)
            );
        }

        this._dragDrop.forEach(d => d.bind(htmlElement));
    }

    tagifyUpdate =
        type =>
        async (_, { option, removed }) => {
            const updatePath = this.levelup.selectionData.reduce((acc, data) => {
                if (data.optionKey === type && removed ? data.data.includes(option) : data.data.length < data.amount) {
                    return `tiers.${data.tier}.levels.${data.level}.optionSelections.${data.optionKey}.${data.checkboxNr}.data`;
                }

                return acc;
            }, null);

            if (!updatePath) {
                ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.noSelectionsLeft')
                );
                return;
            }

            const currentData = foundry.utils.getProperty(this.levelup, updatePath);
            const updatedData = removed ? currentData.filter(x => x !== option) : [...currentData, option];
            await this.levelup.updateSource({ [updatePath]: updatedData });
            this.render();
        };

    static async updateForm(event, _, formData) {
        const { levelup } = foundry.utils.expandObject(formData.object);
        await this.levelup.updateSource(levelup);
        this.render();
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (event.target.closest('.domain-cards')) {
            const target = event.target.closest('.card-preview-container');
            if (item.type === 'domainCard') {
                if (!this.actor.system.class.system.domains.includes(item.system.domain)) {
                    // Also needs to check for multiclass adding a new domain
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.domainCardWrongDomain')
                    );
                    return;
                }

                if (item.system.level > Number(target.dataset.limit)) {
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.domainCardToHighLevel')
                    );
                    return;
                }

                if (
                    Object.values(this.levelup.domainCards).some(x => x.uuid === item.uuid) ||
                    this.levelup.selectionData.some(x => x.type === 'domainCard' && x.data.includes(item.uuid))
                ) {
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.domainCardDuplicate')
                    );
                    return;
                }

                await this.levelup.updateSource({ [target.dataset.path]: item.uuid });
                this.render();
            }
        } else if (event.target.closest('.multiclass-cards')) {
            const target = event.target.closest('.card-preview-container');
            if (item.type === 'class') {
                if (item.name === this.actor.system.class.name) {
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.alreadySelectedClass')
                    );
                    return;
                }

                await this.levelup.updateSource({
                    [target.dataset.path]: {
                        data: item.uuid,
                        secondaryData: null
                    }
                });
                this.render();
            }
        }
    }

    async selectionClick(event) {
        event.stopPropagation();
        const button = event.currentTarget;

        if (!button.checked) {
            await this.levelup.updateSource({
                [`tiers.${button.dataset.tier}.levels.${button.dataset.level}.optionSelections.${button.dataset.option}.-=${button.dataset.checkboxNr}`]:
                    null
            });
        } else {
            const levelSelections = this.levelup.levelSelections;
            if (levelSelections.total + Number(button.dataset.cost) > this.levelup.maxSelections) {
                ui.notifications.info(
                    game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.info.insufficentAdvancements')
                );
                this.render();
                return;
            }

            const nrTiers = Object.keys(this.levelup.tiers).length;
            let lowestLevelChoice = null;
            for (var tierKey = Number(button.dataset.tier); tierKey <= nrTiers + 1; tierKey++) {
                const tier = this.levelup.tiers[tierKey];
                lowestLevelChoice = Object.keys(levelSelections.available).reduce((currentLowest, key) => {
                    const level = Number(key);
                    if (levelSelections.available[key] >= button.dataset.cost && tier.belongingLevels.includes(level)) {
                        if (!currentLowest || level < currentLowest) return level;
                    }

                    return currentLowest;
                }, null);

                if (lowestLevelChoice) break;
            }

            if (!lowestLevelChoice) {
                ui.notifications.info(
                    game.i18n.localize(
                        'DAGGERHEART.Application.LevelUp.notifications.info.insufficientTierAdvancements'
                    )
                );
                this.render();
                return;
            }

            await this.levelup.updateSource({
                [`tiers.${button.dataset.tier}.levels.${lowestLevelChoice}.optionSelections.${button.dataset.option}.${button.dataset.checkboxNr}`]:
                    { selected: true, minCost: button.dataset.cost }
            });
        }

        this.render();
    }

    static async viewCompendium(_, button) {
        (await game.packs.get(`daggerheart.${button.dataset.compendium}`))?.render(true);
    }

    static async selectPreview(_, button) {
        const remove = button.dataset.selected;
        const selectionData = Object.values(this.levelup.selectionData);
        const option = remove
            ? selectionData.find(x => x.type === 'subclass' && x.data.includes(button.dataset.uuid))
            : selectionData.find(x => x.type === 'subclass' && x.data.length === 0);
        if (!option) return;

        const path = `tiers.${option.tier}.levels.${option.level}.optionSelections.${option.optionKey}.${option.checkboxNr}.data`;
        await this.levelup.updateSource({ [path]: remove ? [] : button.dataset.uuid });
        this.render();
    }

    static async selectDomain(_, button) {
        const option = this.levelup.selectionData.find(x => x.type === 'multiclass');
        const path = `tiers.${option.tier}.levels.${option.level}.optionSelections.${option.optionKey}.${option.checkboxNr}.secondaryData`;
        await this.levelup.updateSource({ [path]: option.secondaryData ? null : button.dataset.domain });
        this.render();
    }

    static async save() {
        await this.actor.levelUp(this.levelup.levelupData);
        this.close();
    }
}
