import { abilities } from '../config/actorConfig.mjs';
import { domains } from '../config/domainConfig.mjs';
import { DhLevelup } from '../data/levelup.mjs';
import { getDeleteKeys, tagifyElement } from '../helpers/utils.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhlevelUp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.levelTiers = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers);

        const playerLevelupData = actor.system.levelData;
        this.levelup = new DhLevelup(DhLevelup.initializeData(this.levelTiers, playerLevelupData, actor.system.level));

        this._dragDrop = this._createDragDropHandlers();
        this.tabGroups.primary = 'advancements';
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
            selectDomain: this.selectDomain,
            updateCurrentLevel: this.updateCurrentLevel,
            activatePart: this.activatePart
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: '.levelup-card-selection .card-preview-container' }]
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/views/levelup/tabs/tab-navigation.hbs' },
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
        const currentLevel = this.levelup.levels[this.levelup.currentLevel];
        switch (partId) {
            case 'tabs':
                const previous =
                    this.levelup.currentLevel === this.levelup.startLevel ? null : this.levelup.currentLevel - 1;
                const next = this.levelup.currentLevel === this.levelup.endLevel ? null : this.levelup.currentLevel + 1;
                context.navigate = {
                    previous: {
                        disabled: !previous,
                        label: previous
                            ? game.i18n.format('DAGGERHEART.Application.LevelUp.navigateLevel', { level: previous })
                            : '',
                        fromSummary: this.tabGroups.primary === 'summary'
                    },
                    next: {
                        disabled: !this.levelup.currentLevelFinished,
                        label: next
                            ? game.i18n.format('DAGGERHEART.Application.LevelUp.navigateLevel', { level: next })
                            : '',
                        toSummary: !next,
                        show: this.tabGroups.primary !== 'summary'
                    }
                };

                const { selections } = currentLevel.nrSelections;
                context.tabs.advancements.progress = { selected: selections, max: currentLevel.maxSelections };
                context.showTabs = this.tabGroups.primary !== 'summary';
                break;
            case 'selections':
                const advancementChoices = Object.keys(currentLevel.choices).reduce((acc, choiceKey) => {
                    Object.keys(currentLevel.choices[choiceKey]).forEach(checkboxNr => {
                        const checkbox = currentLevel.choices[choiceKey][checkboxNr];
                        const data = {
                            ...checkbox,
                            path: `levels.${this.levelup.currentLevel}.choices.${choiceKey}.${checkboxNr}`,
                            level: this.levelup.currentLevel
                        };

                        if (!acc[choiceKey]) acc[choiceKey] = [];
                        acc[choiceKey].push(data);
                    });

                    return acc;
                }, {});

                const traits = Object.values(advancementChoices.trait ?? {});
                const traitValues = traits.filter(trait => trait.data.length > 0).flatMap(trait => trait.data);
                context.traits = {
                    values: traitValues,
                    active: traits.length > 0,
                    progress: {
                        selected: traitValues.length,
                        max: traits.reduce((acc, exp) => acc + exp.amount, 0)
                    }
                };

                const experienceIncreases = Object.values(advancementChoices.experience ?? {});
                const experienceIncreaseValues = experienceIncreases
                    .filter(exp => exp.data.length > 0)
                    .flatMap(exp =>
                        exp.data.map(data => this.actor.system.experiences.find(x => x.id === data).description)
                    );
                context.experienceIncreases = {
                    values: experienceIncreaseValues,
                    active: experienceIncreases.length > 0,
                    progress: {
                        selected: experienceIncreaseValues.length,
                        max: experienceIncreases.reduce((acc, exp) => acc + exp.amount, 0)
                    }
                };

                context.newExperiences = Object.keys(currentLevel.achievements.experiences).map(key => {
                    const experience = currentLevel.achievements.experiences[key];
                    return {
                        ...experience,
                        level: this.levelup.currentLevel,
                        key: key
                    };
                });

                const allDomainCards = {
                    ...advancementChoices.domainCard,
                    ...currentLevel.achievements.domainCards
                };
                const allDomainCardKeys = Object.keys(allDomainCards);

                context.domainCards = [];
                for (var key of allDomainCardKeys) {
                    const domainCard = allDomainCards[key];
                    if (domainCard.level > this.levelup.endLevel) continue;

                    const uuid = domainCard.data?.length > 0 ? domainCard.data[0] : domainCard.uuid;
                    const card = uuid ? await foundry.utils.fromUuid(uuid) : {};

                    context.domainCards.push({
                        ...(card.toObject?.() ?? card),
                        emptySubtext: game.i18n.format(
                            'DAGGERHEART.Application.LevelUp.Selections.emptyDomainCardHint',
                            { level: domainCard.level }
                        ),
                        path: domainCard.data
                            ? `${domainCard.path}.data`
                            : `levels.${domainCard.level}.achievements.domainCards.${key}.uuid`,
                        limit: domainCard.level,
                        compendium: 'domains'
                    });
                }

                const subclassSelections = advancementChoices.subclass?.flatMap(x => x.data) ?? [];

                const multiclassSubclass = this.actor.system.multiclass?.system?.subclasses?.[0];
                const possibleSubclasses = [
                    this.actor.system.subclass,
                    ...(multiclassSubclass ? [multiclassSubclass] : [])
                ];
                const selectedSubclasses = possibleSubclasses.filter(x => subclassSelections.includes(x.uuid));
                context.subclassCards = [];
                if (advancementChoices.subclass?.length > 0) {
                    for (var subclass of possibleSubclasses) {
                        const data = await foundry.utils.fromUuid(subclass.uuid);
                        const selected = selectedSubclasses.some(x => x.uuid === data.uuid);
                        context.subclassCards.push({
                            ...data.toObject(),
                            uuid: data.uuid,
                            selected: selected
                        });
                    }
                }

                const multiclasses = Object.values(advancementChoices.multiclass ?? {});
                if (multiclasses?.[0]) {
                    const data = multiclasses[0];
                    const multiclass = data.data.length > 0 ? await foundry.utils.fromUuid(data.data[0]) : {};

                    context.multiclass = {
                        ...data,
                        ...(multiclass.toObject?.() ?? multiclass),
                        uuid: multiclass.uuid,
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
                const { current: currentActorLevel, changed: changedActorLevel } = this.actor.system.levelData.level;
                const actorArmor = this.actor.system.armor;
                const levelKeys = Object.keys(this.levelup.levels);
                let achivementProficiency = 0;
                const achievementCards = [];
                let achievementExperiences = [];
                for (var levelKey of levelKeys) {
                    const level = this.levelup.levels[levelKey];
                    if (Number(levelKey) < this.levelup.startLevel) continue;

                    achivementProficiency += level.achievements.proficiency ?? 0;
                    const cards = level.achievements.domainCards ? Object.values(level.achievements.domainCards) : null;
                    if (cards) {
                        for (var card of cards) {
                            const itemCard = await foundry.utils.fromUuid(card.uuid);
                            achievementCards.push(itemCard);
                        }
                    }

                    achievementExperiences = level.achievements.experiences
                        ? Object.values(level.achievements.experiences).reduce((acc, experience) => {
                              if (experience.name) acc.push(experience);
                              return acc;
                          }, [])
                        : [];
                }

                context.achievements = {
                    proficiency: {
                        old: this.actor.system.proficiency.value,
                        new: this.actor.system.proficiency.value + achivementProficiency,
                        shown: achivementProficiency > 0
                    },
                    damageThresholds: {
                        major: {
                            old: this.actor.system.damageThresholds.major,
                            new: this.actor.system.damageThresholds.major + changedActorLevel - currentActorLevel
                        },
                        severe: {
                            old: this.actor.system.damageThresholds.severe,
                            new:
                                this.actor.system.damageThresholds.severe +
                                (actorArmor
                                    ? changedActorLevel - currentActorLevel
                                    : (changedActorLevel - currentActorLevel) * 2)
                        },
                        unarmored: !actorArmor
                    },
                    domainCards: {
                        values: achievementCards,
                        shown: achievementCards.length > 0
                    },
                    experiences: {
                        values: achievementExperiences
                    }
                };

                const advancement = {};
                for (var levelKey of levelKeys) {
                    const level = this.levelup.levels[levelKey];
                    if (Number(levelKey) < this.levelup.startLevel) continue;

                    for (var choiceKey of Object.keys(level.choices)) {
                        const choice = level.choices[choiceKey];
                        for (var checkbox of Object.values(choice)) {
                            switch (choiceKey) {
                                case 'proficiency':
                                case 'hitPoint':
                                case 'stress':
                                case 'evasion':
                                    advancement[choiceKey] = advancement[choiceKey]
                                        ? advancement[choiceKey] + Number(checkbox.value)
                                        : Number(checkbox.value);
                                    break;
                                case 'domainCard':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = [];
                                    if (checkbox.data.length === 1) {
                                        const choiceItem = await foundry.utils.fromUuid(checkbox.data[0]);
                                        advancement[choiceKey].push(choiceItem.toObject());
                                    }
                                    break;
                                case 'experience':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = [];
                                    const data = checkbox.data.map(
                                        data =>
                                            this.actor.system.experiences.find(x => x.id === data)?.description ?? ''
                                    );
                                    advancement[choiceKey].push({ data: data, value: checkbox.value });
                                    break;
                            }
                        }
                    }
                }

                context.advancements = {
                    statistics: {
                        proficiency: {
                            old: context.achievements.proficiency.new,
                            new: context.achievements.proficiency.new + (advancement.proficiency ?? 0)
                        },
                        hitPoints: {
                            old: this.actor.system.resources.hitPoints.max,
                            new: this.actor.system.resources.hitPoints.max + (advancement.hitPoint ?? 0)
                        },
                        stress: {
                            old: this.actor.system.resources.stress.max,
                            new: this.actor.system.resources.stress.max + (advancement.stress ?? 0)
                        },
                        evasion: {
                            old: this.actor.system.evasion.value,
                            new: this.actor.system.evasion.value + (advancement.evasion ?? 0)
                        }
                    },
                    traits:
                        advancement.trait?.flatMap(x =>
                            x.data.map(data => game.i18n.localize(abilities[data].label))
                        ) ?? [],
                    domainCards: advancement.domainCard ?? [],
                    experiences:
                        advancement.experience?.flatMap(x => x.data.map(data => ({ name: data, modifier: x.value }))) ??
                        []
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
            const updatePath = Object.keys(this.levelup.levels[this.levelup.currentLevel].choices).reduce(
                (acc, choiceKey) => {
                    const choice = this.levelup.levels[this.levelup.currentLevel].choices[choiceKey];
                    Object.keys(choice).forEach(checkboxNr => {
                        const checkbox = choice[checkboxNr];
                        if (
                            choiceKey === type &&
                            (removed ? checkbox.data.includes(option) : checkbox.data.length < checkbox.amount)
                        ) {
                            acc = `levels.${this.levelup.currentLevel}.choices.${choiceKey}.${checkboxNr}.data`;
                        }
                    });

                    return acc;
                },
                null
            );

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
                if (
                    !this.actor.system.class.system.domains.includes(item.system.domain) &&
                    this.levelup.classUpgradeChoices?.multiclass?.domain !== item.system.domain
                ) {
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
                    Object.values(this.levelup.levels).some(level => {
                        const achievementExists = Object.values(level.achievements.domainCards).some(
                            card => card.uuid === item.uuid
                        );
                        const advancementExists = Object.keys(level.choices).some(choiceKey => {
                            if (choiceKey !== 'domainCard') return false;
                            const choice = level.choices[choiceKey];
                            return Object.values(choice).some(checkbox => checkbox.data.includes(item.uuid));
                        });

                        return achievementExists || advancementExists;
                    })
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
            const target = event.target.closest('.multiclass-cards');
            if (item.type === 'class') {
                if (item.name === this.actor.system.class.name) {
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.alreadySelectedClass')
                    );
                    return;
                }

                await this.levelup.updateSource({
                    multiclass: {
                        class: item.uuid,
                        level: this.levelup.currentLevel,
                        tier: Number(target.dataset.tier)
                    },
                    [target.dataset.path]: {
                        tier: Number(target.dataset.tier),
                        minCost: Number(target.dataset.minCost),
                        amount: target.dataset.amount ? Number(target.dataset.amount) : null,
                        value: target.dataset.value,
                        type: target.dataset.type,
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

        const update = {};
        if (!button.checked) {
            if (button.dataset.cost > 1) {
                // Simple handling that doesn't cover potential Custom LevelTiers.
                update[`levels.${this.levelup.currentLevel}.choices.-=${button.dataset.option}`] = null;
            } else {
                update[
                    `levels.${this.levelup.currentLevel}.choices.${button.dataset.option}.-=${button.dataset.checkboxNr}`
                ] = null;
            }
        } else {
            if (!this.levelup.levels[this.levelup.currentLevel].nrSelections.available) {
                ui.notifications.info(
                    game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.info.insufficentAdvancements')
                );
                this.render();
                return;
            }

            update[
                `levels.${this.levelup.currentLevel}.choices.${button.dataset.option}.${button.dataset.checkboxNr}`
            ] = {
                tier: Number(button.dataset.tier),
                minCost: Number(button.dataset.cost),
                amount: button.dataset.amount ? Number(button.dataset.amount) : null,
                value: button.dataset.value,
                type: button.dataset.type
            };
        }

        await this.levelup.updateSource(update);
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
        const option = foundry.utils.getProperty(this.levelup, button.dataset.path);
        const domain = option.secondaryData ? null : button.dataset.domain;

        await this.levelup.updateSource({
            multiclass: { domain },
            [`${button.dataset.path}.secondaryData`]: domain
        });
        this.render();
    }

    static async updateCurrentLevel(_, button) {
        if (!button.dataset.forward) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.Application.LevelUp.Delevel.title')
                },
                content: game.i18n.format('DAGGERHEART.Application.LevelUp.Delevel.content')
            });

            if (!confirmed) return;

            await this.levelup.updateSource({
                currentLevel: Math.min(this.levelup.currentLevel - 1, this.levelup.startLevel),
                levels: Object.keys(this.levelup.levels).reduce((acc, key) => {
                    const level = this.levelup.levels[key];
                    if (Number(key) === this.levelup.currentLevel) {
                        acc[key] = {
                            achievements: {
                                experiences: getDeleteKeys(level.achievements.experiences, 'name', ''),
                                domainCards: getDeleteKeys(level.achievements.domainCards, 'uuid', null)
                            },
                            choices: getDeleteKeys(level.choices)
                        };
                    }
                    return acc;
                }, {})
            });
        } else {
            await this.levelup.updateSource({
                currentLevel: Math.min(this.levelup.currentLevel + 1, this.levelup.endLevel)
            });
        }

        this.tabGroups.primary = 'advancements';
        this.render();
    }

    static activatePart(_, button) {
        this.tabGroups.primary = button.dataset.part;
        this.render();
    }

    static async save() {
        const levelupData = Object.keys(this.levelup.levels).reduce((acc, level) => {
            if (level >= this.levelup.startLevel) {
                acc[level] = this.levelup.levels[level].toObject();
            }

            return acc;
        }, {});

        await this.actor.levelUp(levelupData);
        this.close();
    }
}
