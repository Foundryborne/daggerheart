import { abilities } from '../config/actorConfig.mjs';
import { chunkify } from '../helpers/utils.mjs';
import { LevelOptionType } from './levelTier.mjs';

export class DhLevelup extends foundry.abstract.DataModel {
    static initializeData(levelTierData, pcLevelData) {
        const startLevel = pcLevelData.level.current + 1;
        const currentLevel = pcLevelData.level.current + 1;
        const endLevel = pcLevelData.level.changed;

        const tiers = {};
        const levels = {};
        const tierKeys = Object.keys(levelTierData.tiers);
        tierKeys.forEach(key => {
            const tier = levelTierData.tiers[key];
            const belongingLevels = [];
            for (var i = tier.levels.start; i <= tier.levels.end; i++) {
                if (i <= endLevel) {
                    const initialAchievements = i === tier.levels.start ? tier.initialAchievements : {};
                    const experiences = initialAchievements.experience
                        ? [...Array(initialAchievements.experience.nr).keys()].reduce((acc, _) => {
                              acc[foundry.utils.randomID()] = {
                                  name: '',
                                  modifier: initialAchievements.experience.modifier
                              };
                              return acc;
                          }, {})
                        : {};

                    const domainCards = [...Array(tier.domainCardByLevel).keys()].reduce((acc, _) => {
                        const id = foundry.utils.randomID();
                        acc[id] = { uuid: null, itemUuid: null, level: i };
                        return acc;
                    }, {});

                    levels[i] = DhLevelupLevel.initializeData(pcLevelData.levelups[i], tier.maxSelections[i], {
                        ...initialAchievements,
                        experiences,
                        domainCards
                    });
                }

                belongingLevels.push(i);
            }

            /* Improve. Temporary handling for Companion new experiences */
            Object.keys(tier.extraAchievements ?? {}).forEach(key => {
                const level = Number(key);
                if (level >= startLevel && level <= endLevel) {
                    const levelExtras = tier.extraAchievements[level];
                    if (levelExtras.experience) {
                        levels[level].achievements.experiences[foundry.utils.randomID()] = {
                            name: '',
                            modifier: levelExtras.experience.modifier
                        };
                    }
                }
            });

            tiers[key] = {
                name: tier.name,
                belongingLevels: belongingLevels,
                options: Object.keys(tier.options).reduce((acc, key) => {
                    acc[key] = tier.options[key].toObject?.() ?? tier.options[key];
                    return acc;
                }, {})
            };
        });

        return {
            tiers,
            levels,
            startLevel,
            currentLevel,
            endLevel
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tiers: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({ required: true }),
                    belongingLevels: new fields.ArrayField(new fields.NumberField({ required: true, integer: true })),
                    options: new fields.TypedObjectField(
                        new fields.SchemaField({
                            label: new fields.StringField({ required: true }),
                            checkboxSelections: new fields.NumberField({ required: true, integer: true }),
                            minCost: new fields.NumberField({ required: true, integer: true }),
                            type: new fields.StringField({ required: true, choices: LevelOptionType }),
                            value: new fields.NumberField({ integer: true }),
                            amount: new fields.NumberField({ integer: true })
                        })
                    )
                })
            ),
            levels: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupLevel)),
            startLevel: new fields.NumberField({ required: true, integer: true }),
            currentLevel: new fields.NumberField({ required: true, integer: true }),
            endLevel: new fields.NumberField({ required: true, integer: true })
        };
    }

    #levelFinished(levelKey) {
        const allSelectionsMade = this.levels[levelKey].nrSelections.available === 0;
        const allChoicesMade = Object.keys(this.levels[levelKey].choices).every(choiceKey => {
            const choice = this.levels[levelKey].choices[choiceKey];
            return Object.values(choice).every(checkbox => {
                switch (choiceKey) {
                    case 'trait':
                    case 'experience':
                    case 'domainCard':
                    case 'subclass':
                    case 'vicious':
                        return checkbox.data.length === (checkbox.amount ?? 1);
                    case 'multiclass':
                        const classSelected = checkbox.data.length === 1;
                        const domainSelected = checkbox.secondaryData.domain;
                        const subclassSelected = checkbox.secondaryData.subclass;
                        return classSelected && domainSelected && subclassSelected;
                    default:
                        return true;
                }
            });
        });
        const experiencesSelected = !this.levels[levelKey].achievements.experiences
            ? true
            : Object.values(this.levels[levelKey].achievements.experiences).every(exp => exp.name);
        const domainCardsSelected = Object.values(this.levels[levelKey].achievements.domainCards)
            .filter(x => x.level <= this.endLevel)
            .every(card => card.uuid);
        const allAchievementsSelected = experiencesSelected && domainCardsSelected;

        return allSelectionsMade && allChoicesMade && allAchievementsSelected;
    }

    get currentLevelFinished() {
        return this.#levelFinished(this.currentLevel);
    }

    get allLevelsFinished() {
        return Object.keys(this.levels)
            .filter(level => Number(level) >= this.startLevel)
            .every(this.#levelFinished.bind(this));
    }

    get unmarkedTraits() {
        const possibleLevels = Object.values(this.tiers).reduce((acc, tier) => {
            if (tier.belongingLevels.includes(this.currentLevel)) acc = tier.belongingLevels;
            return acc;
        }, []);

        return Object.keys(this.levels)
            .filter(key => possibleLevels.some(x => x === Number(key)))
            .reduce(
                (acc, levelKey) => {
                    const level = this.levels[levelKey];
                    Object.values(level.choices).forEach(choice =>
                        Object.values(choice).forEach(checkbox => {
                            if (
                                checkbox.type === 'trait' &&
                                checkbox.data.length > 0 &&
                                Number(levelKey) !== this.currentLevel
                            ) {
                                checkbox.data.forEach(data => delete acc[data]);
                            }
                        })
                    );

                    return acc;
                },
                { ...abilities }
            );
    }

    get classUpgradeChoices() {
        let subclasses = [];
        let multiclass = null;
        Object.keys(this.levels).forEach(levelKey => {
            const level = this.levels[levelKey];
            Object.values(level.choices).forEach(choice => {
                Object.values(choice).forEach(checkbox => {
                    if (checkbox.type === 'multiclass') {
                        multiclass = {
                            class: checkbox.data.length > 0 ? checkbox.data[0] : null,
                            domain: checkbox.secondaryData.domain ?? null,
                            subclass: checkbox.secondaryData.subclass ?? null,
                            tier: checkbox.tier,
                            level: levelKey
                        };
                    }
                    if (checkbox.type === 'subclass') {
                        subclasses.push({
                            tier: checkbox.tier,
                            level: levelKey
                        });
                    }
                });
            });
        });
        return { subclasses, multiclass };
    }

    get tiersForRendering() {
        const tierKeys = Object.keys(this.tiers);
        const selections = Object.keys(this.levels).reduce(
            (acc, key) => {
                const level = this.levels[key];
                Object.keys(level.choices).forEach(optionKey => {
                    const choice = level.choices[optionKey];
                    Object.keys(choice).forEach(checkboxNr => {
                        const checkbox = choice[checkboxNr];
                        if (!acc[checkbox.tier][optionKey]) acc[checkbox.tier][optionKey] = {};
                        Object.keys(choice).forEach(checkboxNr => {
                            acc[checkbox.tier][optionKey][checkboxNr] = { ...checkbox, level: Number(key) };
                        });
                    });
                });

                return acc;
            },
            tierKeys.reduce((acc, key) => {
                acc[key] = {};
                return acc;
            }, {})
        );

        const { multiclass, subclasses } = this.classUpgradeChoices;
        return tierKeys.map((tierKey, tierIndex) => {
            const tier = this.tiers[tierKey];
            const multiclassInTier = multiclass?.tier === Number(tierKey);
            const subclassInTier = subclasses.some(x => x.tier === Number(tierKey));

            return {
                name: tier.name,
                active: this.currentLevel >= Math.min(...tier.belongingLevels),
                groups: Object.keys(tier.options).map(optionKey => {
                    const option = tier.options[optionKey];

                    const checkboxes = [...Array(option.checkboxSelections).keys()].flatMap(index => {
                        const checkboxNr = index + 1;
                        const checkboxData = selections[tierKey]?.[optionKey]?.[checkboxNr];
                        const checkbox = { ...option, checkboxNr, tier: tierKey };

                        if (checkboxData) {
                            checkbox.level = checkboxData.level;
                            checkbox.selected = true;
                            checkbox.disabled = checkbox.level !== this.currentLevel;
                        }

                        if (optionKey === 'multiclass') {
                            if ((multiclass && !multiclassInTier) || subclassInTier) {
                                checkbox.disabled = true;
                            }
                        }

                        if (optionKey === 'subclass' && multiclassInTier) {
                            checkbox.disabled = true;
                        }

                        return checkbox;
                    });

                    let label = game.i18n.localize(option.label);
                    if (optionKey === 'domainCard') {
                        const maxLevel = tier.belongingLevels[tier.belongingLevels.length - 1];
                        label = game.i18n.format(option.label, { maxLevel });
                    }

                    return {
                        label: label,
                        checkboxGroups: chunkify(checkboxes, option.minCost, chunkedBoxes => {
                            const anySelected = chunkedBoxes.some(x => x.selected);
                            const anyDisabled = chunkedBoxes.some(x => x.disabled);
                            return {
                                multi: option.minCost > 1,
                                checkboxes: chunkedBoxes.map(x => ({
                                    ...x,
                                    selected: anySelected,
                                    disabled: anyDisabled
                                }))
                            };
                        })
                    };
                })
            };
        });
    }
}

export class DhLevelupLevel extends foundry.abstract.DataModel {
    static initializeData(levelData = { selections: [] }, maxSelections, achievements) {
        return {
            maxSelections: maxSelections,
            achievements: {
                experiences: levelData.achievements?.experiences ?? achievements.experiences ?? {},
                domainCards: levelData.achievements?.domainCards
                    ? levelData.achievements.domainCards.reduce((acc, card, index) => {
                          acc[index] = { ...card };
                          return acc;
                      }, {})
                    : (achievements.domainCards ?? {}),
                proficiency: levelData.achievements?.proficiency ?? achievements.proficiency ?? null
            },
            choices: levelData.selections.reduce((acc, data) => {
                if (!acc[data.optionKey]) acc[data.optionKey] = {};
                acc[data.optionKey][data.checkboxNr] = { ...data };

                return acc;
            }, {})
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            maxSelections: new fields.NumberField({ required: true, integer: true }),
            achievements: new fields.SchemaField({
                experiences: new fields.TypedObjectField(
                    new fields.SchemaField({
                        name: new fields.StringField({ required: true }),
                        modifier: new fields.NumberField({ required: true, integer: true })
                    })
                ),
                domainCards: new fields.TypedObjectField(
                    new fields.SchemaField({
                        uuid: new fields.StringField({ required: true, nullable: true, initial: null }),
                        itemUuid: new fields.StringField({ required: true }),
                        level: new fields.NumberField({ required: true, integer: true })
                    })
                ),
                proficiency: new fields.NumberField({ integer: true })
            }),
            choices: new fields.TypedObjectField(
                new fields.TypedObjectField(
                    new fields.SchemaField({
                        tier: new fields.NumberField({ required: true, integer: true }),
                        minCost: new fields.NumberField({ required: true, integer: true }),
                        amount: new fields.NumberField({ integer: true }),
                        value: new fields.StringField(),
                        data: new fields.ArrayField(new fields.StringField()),
                        secondaryData: new fields.TypedObjectField(new fields.StringField()),
                        type: new fields.StringField({ required: true })
                    })
                )
            )
        };
    }

    get nrSelections() {
        const selections = Object.keys(this.choices).reduce((acc, choiceKey) => {
            const choice = this.choices[choiceKey];
            acc += Object.values(choice).reduce((acc, x) => acc + x.minCost, 0);

            return acc;
        }, 0);

        return {
            selections: selections,
            available: this.maxSelections - selections
        };
    }
}
