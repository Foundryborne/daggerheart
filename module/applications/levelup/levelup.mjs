import { abilities, subclassFeatureLabels } from '../../config/actorConfig.mjs';
import { getDeleteKeys, tagifyElement } from '../../helpers/utils.mjs';
import { ItemBrowser } from '../ui/itemBrowser.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhlevelUp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;

        this._dragDrop = this._createDragDropHandlers();
        this.tabGroups.primary = 'advancements';

        this.itemBrowser = null;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.Levelup.title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'levelup'],
        position: { width: 1000, height: 'auto' },
        window: {
            resizable: true,
            icon: 'fa-solid fa-arrow-turn-up'
        },
        actions: {
            save: this.save,
            viewCompendium: this.viewCompendium,
            selectPreview: this.selectPreview,
            selectDomain: this.selectDomain,
            selectSubclass: this.selectSubclass,
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
        tabs: { template: 'systems/daggerheart/templates/levelup/tabs/tab-navigation.hbs' },
        advancements: {
            template: 'systems/daggerheart/templates/levelup/tabs/advancements.hbs'
        },
        selections: {
            template: 'systems/daggerheart/templates/levelup/tabs/selections.hbs',
            scrollable: ['.levelup-selections-container']
        },
        summary: { template: 'systems/daggerheart/templates/levelup/tabs/summary.hbs' },
        footer: { template: 'systems/daggerheart/templates/levelup/tabs/footer.hbs' }
    };

    static TABS = {
        advancements: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'advancements',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.advancement'
        },
        selections: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'selections',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.selections'
        },
        summary: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'summary',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.summary'
        }
    };

    addBonusChoices(levelTiers) {
        for (var tierKey in levelTiers.tiers) {
            const tier = levelTiers.tiers[tierKey];
            tier.maxSelections = [...Array(tier.levels.end - tier.levels.start + 1).keys()].reduce((acc, index) => {
                const level = tier.levels.start + index;
                const bonus = this.actor.system.levelData.level.bonuses[level];
                acc[level] = tier.availableOptions + (bonus ?? 0);

                return acc;
            }, {});
        }

        return levelTiers;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.levelup = this.levelup;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.levelupAuto = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).levelupAuto;

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
                            ? game.i18n.format('DAGGERHEART.APPLICATIONS.Levelup.navigateLevel', { level: previous })
                            : '',
                        fromSummary: this.tabGroups.primary === 'summary'
                    },
                    next: {
                        disabled: !this.levelup.currentLevelFinished,
                        label: next
                            ? game.i18n.format('DAGGERHEART.APPLICATIONS.Levelup.navigateLevel', { level: next })
                            : '',
                        toSummary: !next,
                        show: this.tabGroups.primary !== 'summary'
                    }
                };

                const { selections } = currentLevel.nrSelections;
                context.tabs.advancements.progress = { selected: selections, max: currentLevel.maxSelections };
                context.showTabs = this.tabGroups.primary !== 'summary';
                break;

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
                        old: this.actor.system.proficiency,
                        new: this.actor.system.proficiency + achivementProficiency,
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
                                case 'trait':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = {};
                                    for (var traitKey of checkbox.data) {
                                        if (!advancement[choiceKey][traitKey]) advancement[choiceKey][traitKey] = 0;
                                        advancement[choiceKey][traitKey] += 1;
                                    }
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
                                    const data = checkbox.data.map(data => {
                                        const experience = Object.keys(this.actor.system.experiences).find(
                                            x => x === data
                                        );
                                        return this.actor.system.experiences[experience]?.description ?? '';
                                    });
                                    advancement[choiceKey].push({ data: data, value: checkbox.value });
                                    break;
                                case 'subclass':
                                    if (checkbox.data[0]) {
                                        const subclassItem = await foundry.utils.fromUuid(checkbox.data[0]);
                                        if (!advancement[choiceKey]) advancement[choiceKey] = [];
                                        advancement[choiceKey].push({
                                            ...subclassItem.toObject(),
                                            featureLabel: game.i18n.localize(
                                                subclassFeatureLabels[Number(checkbox.secondaryData.featureState)]
                                            )
                                        });
                                    }
                                    break;
                                case 'multiclass':
                                    const multiclassItem = await foundry.utils.fromUuid(checkbox.data[0]);
                                    const subclass = multiclassItem
                                        ? await foundry.utils.fromUuid(checkbox.secondaryData.subclass)
                                        : null;
                                    advancement[choiceKey] = multiclassItem
                                        ? {
                                              ...multiclassItem.toObject(),
                                              domain: checkbox.secondaryData.domain
                                                  ? game.i18n.localize(
                                                        CONFIG.DH.DOMAIN.allDomains()[checkbox.secondaryData.domain]
                                                            .label
                                                    )
                                                  : null,
                                              subclass: subclass ? subclass.name : null
                                          }
                                        : {};
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
                            old: this.actor.system.evasion,
                            new: this.actor.system.evasion + (advancement.evasion ?? 0)
                        }
                    },
                    traits: Object.keys(this.actor.system.traits).reduce((acc, traitKey) => {
                        if (advancement.trait?.[traitKey]) {
                            if (!acc) acc = {};
                            acc[traitKey] = {
                                label: game.i18n.localize(abilities[traitKey].label),
                                old: this.actor.system.traits[traitKey].value,
                                new: this.actor.system.traits[traitKey].value + advancement.trait[traitKey]
                            };
                        }
                        return acc;
                    }, null),
                    domainCards: advancement.domainCard ?? [],
                    experiences:
                        advancement.experience?.flatMap(x => x.data.map(data => ({ name: data, modifier: x.value }))) ??
                        [],
                    multiclass: advancement.multiclass,
                    subclass: advancement.subclass
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
            tagifyElement(traitsTagify, this.levelup.unmarkedTraits, this.tagifyUpdate('trait').bind(this));
        }

        const experienceIncreaseTagify = htmlElement.querySelector('.levelup-experience-increases');
        if (experienceIncreaseTagify) {
            tagifyElement(
                experienceIncreaseTagify,
                Object.keys(this.actor.system.experiences).reduce((acc, id) => {
                    const experience = this.actor.system.experiences[id];
                    acc.push({ id: id, label: experience.name });

                    return acc;
                }, []),
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
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noSelectionsLeft'));
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
                const { multiclass } = this.levelup.classUpgradeChoices;
                const isMulticlass = !multiclass ? false : item.system.domain === multiclass.domain;
                if (
                    !this.actor.system.domains.includes(item.system.domain) &&
                    this.levelup.classUpgradeChoices?.multiclass?.domain !== item.system.domain
                ) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.domainCardWrongDomain'));
                    return;
                }

                const levelBase = isMulticlass ? Math.ceil(this.levelup.currentLevel / 2) : this.levelup.currentLevel;
                const levelMax = target.dataset.limit ? Math.min(Number(target.dataset.limit), levelBase) : levelBase;
                if (levelMax < item.system.level) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.domainCardToHighLevel'));
                    return;
                }

                const cardExistsInCharacter = this.actor.items.find(x => x.name === item.name); // Any other way to check? The item is a copy so different ids
                const cardExistsInLevelup = Object.values(this.levelup.levels).some(level => {
                    const achievementExists = Object.values(level.achievements.domainCards).some(
                        card => card.uuid === item.uuid
                    );
                    const advancementExists = Object.keys(level.choices).some(choiceKey => {
                        if (choiceKey !== 'domainCard') return false;
                        const choice = level.choices[choiceKey];
                        return Object.values(choice).some(checkbox => checkbox.data.includes(item.uuid));
                    });

                    return achievementExists || advancementExists;
                });
                if (cardExistsInCharacter || cardExistsInLevelup) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.domainCardDuplicate'));
                    return;
                }

                await this.levelup.updateSource({ [target.dataset.path]: item.uuid });
                this.render();
            }
        } else if (event.target.closest('.multiclass-cards')) {
            const target = event.target.closest('.multiclass-cards');
            if (item.type === 'class') {
                if (item.name === this.actor.system.class.value.name) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.alreadySelectedClass'));
                    return;
                }

                const secondaryData = Object.keys(
                    foundry.utils.getProperty(this.levelup, `${target.dataset.path}.secondaryData`)
                ).reduce((acc, key) => {
                    acc[`-=${key}`] = null;
                    return acc;
                }, {});
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
                        secondaryData: secondaryData
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
            const basePath = `levels.${this.levelup.currentLevel}.choices`;
            const current = foundry.utils.getProperty(this.levelup, `${basePath}.${button.dataset.option}`);
            if (Number(button.dataset.cost) > 1 || Object.keys(current).length === 1) {
                // Simple handling that doesn't cover potential Custom LevelTiers.
                update[`${basePath}.-=${button.dataset.option}`] = null;
            } else {
                update[`${basePath}.${button.dataset.option}.-=${button.dataset.checkboxNr}`] = null;
            }
        } else {
            if (this.levelup.levels[this.levelup.currentLevel].nrSelections.available < Number(button.dataset.cost)) {
                ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.insufficentAdvancements'));
                this.render();
                return;
            }

            const updateData = {
                tier: Number(button.dataset.tier),
                minCost: Number(button.dataset.cost),
                amount: button.dataset.amount ? Number(button.dataset.amount) : null,
                value: button.dataset.value,
                type: button.dataset.type
            };

            if (button.dataset.type === 'domainCard') {
                updateData.secondaryData = {
                    limit: Math.max(...this.levelup.tiers[button.dataset.tier].belongingLevels)
                };
            }

            update[
                `levels.${this.levelup.currentLevel}.choices.${button.dataset.option}.${button.dataset.checkboxNr}`
            ] = updateData;
        }

        await this.levelup.updateSource(update);
        this.render();
    }

    static async viewCompendium(event, target) {
        const type = target.dataset.compendium ?? target.dataset.type;

        const presets = {
            compendium: 'daggerheart',
            folder: type,
            render: {
                noFolder: true
            }
        };

        if (type == 'domains') {
            const domains = this.actor.system.domains,
                multiclassDomain = this.levelup.classUpgradeChoices?.multiclass?.domain;
            if (multiclassDomain) {
                if (!domains.includes(x => x === multiclassDomain)) domains.push(multiclassDomain);
            }
            presets.filter = {
                'level.max': { key: 'level.max', value: this.levelup.currentLevel },
                'system.domain': { key: 'system.domain', value: domains }
            };
        }

        return (this.itemBrowser = await new ItemBrowser({ presets }).render({ force: true }));
    }

    static async selectPreview(_, button) {
        const remove = button.dataset.selected;
        await this.levelup.updateSource({
            [`${button.dataset.path}`]: {
                data: remove ? [] : [button.dataset.uuid],
                secondaryData: {
                    featureState: button.dataset.featureState,
                    isMulticlass: button.dataset.isMulticlass
                }
            }
        });

        this.render();
    }

    static async selectDomain(_, button) {
        const option = foundry.utils.getProperty(this.levelup, button.dataset.path);
        const domain = option.secondaryData.domain ? null : button.dataset.domain;
        const update = { [`${button.dataset.path}.secondaryData.domain`]: domain };

        const domainCards = this.levelup.levels[this.levelup.currentLevel].achievements.domainCards;
        const illegalDomainCards = option.secondaryData.domain
            ? Object.keys(domainCards)
                  .map(key => ({ ...domainCards[key], key }))
                  .filter(
                      x => x.uuid && foundry.utils.fromUuidSync(x.uuid).system.domain === option.secondaryData.domain
                  )
            : [];
        illegalDomainCards.forEach(card => {
            update[`levels.${this.levelup.currentLevel}.achievements.domainCards.${card.key}.uuid`] = null;
        });

        await this.levelup.updateSource(update);
        this.render();
    }

    static async selectSubclass(_, button) {
        const option = foundry.utils.getProperty(this.levelup, button.dataset.path);
        const subclass = option.secondaryData.subclass ? null : button.dataset.subclass;

        await this.levelup.updateSource({
            [`${button.dataset.path}.secondaryData.subclass`]: subclass
        });
        this.render();
    }

    static async updateCurrentLevel(_, button) {
        if (!button.dataset.forward) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.APPLICATIONS.Levelup.delevel.title')
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.Levelup.delevel.content')
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
        if (this.itemBrowser) this.itemBrowser.close();
        this.close();
    }
}
