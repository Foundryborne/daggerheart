import { chunkify } from '../helpers/utils.mjs';
import { LevelOptionType } from './levelTier.mjs';

export class DhLevelup extends foundry.abstract.DataModel {
    static initializeData(levelTierData, pcLevelData) {
        const availableChoicesPerLevel = levelTierData.availableChoicesPerLevel;
        const tierKeys = Object.keys(levelTierData.tiers);
        const maxLevel = levelTierData.tiers[tierKeys[tierKeys.length - 1]].levels.end;

        const totalLevelProgression = [];
        for (var level = pcLevelData.level.current + 1; level <= pcLevelData.level.changed; level++) {
            totalLevelProgression.push(level);
        }

        const pcSelections = Object.values(pcLevelData.levelups).flatMap(x => x.selections);
        const tiers = tierKeys.reduce((acc, key) => {
            acc[key] = DhLevelupTier.initializeData(
                levelTierData.tiers[key],
                maxLevel,
                pcSelections.filter(x => x.tier === Number(key)),
                pcLevelData.level.changed
            );

            return acc;
        }, {});

        const allInitialAchievements = Object.values(tiers).reduce((acc, tier) => {
            const levelThreshold = Math.min(...tier.belongingLevels);

            if (totalLevelProgression.includes(levelThreshold)) {
                acc[levelThreshold] = {
                    newExperiences: {},
                    proficiency: tier.initialAchievements.proficiency
                };
                [...Array(tier.initialAchievements.experience.nr).keys()].forEach(_ => {
                    acc[levelThreshold].newExperiences[foundry.utils.randomID()] = {
                        name: '',
                        modifier: tier.initialAchievements.experience.modifier
                    };
                });
            }

            return acc;
        }, {});

        const domainCards = Object.keys(tiers).reduce((acc, tierKey) => {
            const tier = tiers[tierKey];
            for (var level of tier.belongingLevels) {
                if (level <= pcLevelData.level.current) {
                    const cardId = foundry.utils.randomID();
                    acc[cardId] = {
                        ...pcLevelData.levelups[level].domainCards[0],
                        path: `domainCards.${cardId}.uuid`,
                        locked: true,
                        level: level,
                        tier: tierKey
                    };
                } else if (level <= pcLevelData.level.changed) {
                    for (var domainCardSlot = 1; domainCardSlot <= tier.domainCardByLevel; domainCardSlot++) {
                        const cardId = foundry.utils.randomID();
                        acc[cardId] = {
                            uuid: null,
                            tier: tierKey,
                            level: level,
                            domainCardSlot: domainCardSlot,
                            path: `domainCards.${cardId}.uuid`
                        };
                    }
                }
            }

            return acc;
        }, {});

        return {
            tiers: tiers,
            maxSelections: [...Array(pcLevelData.level.changed).keys()].reduce((acc, index) => {
                const level = index + 1;
                const availableChoices = availableChoicesPerLevel[level];
                if (level > 1 && availableChoices) {
                    acc += availableChoices;
                }

                return acc;
            }, 0),
            allInitialAchievements: allInitialAchievements,
            domainCards: domainCards,
            progressionLevels: totalLevelProgression
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tiers: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupTier)),
            maxSelections: new fields.NumberField({ required: true, integer: true }),
            allInitialAchievements: new fields.TypedObjectField(
                new fields.SchemaField({
                    newExperiences: new fields.TypedObjectField(
                        new fields.SchemaField({
                            name: new fields.StringField({ required: true }),
                            modifier: new fields.NumberField({ required: true, integer: true })
                        })
                    ),
                    proficiency: new fields.NumberField({ required: true, integer: true })
                })
            ),
            domainCards: new fields.TypedObjectField(
                new fields.SchemaField({
                    uuid: new fields.StringField({ required: true, nullable: true, initial: null }),
                    tier: new fields.NumberField({ required: true, integer: true }),
                    level: new fields.NumberField({ required: true, integer: true }),
                    domainCardSlot: new fields.NumberField({ required: true, integer: true }),
                    path: new fields.StringField({ required: true }),
                    locked: new fields.BooleanField({ required: true, initial: false })
                })
            ),
            progressionLevels: new fields.ArrayField(new fields.NumberField({ required: true, integer: true }))
        };
    }

    get canLevelUp() {
        if (this.levelSelections.total !== this.maxSelections) return false;

        const achievementsDone =
            Object.values(this.allInitialAchievements).every(achievement =>
                Object.values(achievement.newExperiences).every(experience => experience.name)
            ) && Object.values(this.domainCards).every(card => card.uuid);

        const selectionData = this.selectionData;
        let advancementsDone = true;
        for (var advancement of selectionData) {
            switch (advancement.type) {
                case 'trait':
                case 'experience':
                case 'domainCard':
                case 'subclass':
                    advancementsDone = advancement.amount
                        ? advancement.data.length === advancement.amount
                        : advancement.data.length === 1;
                    break;
                case 'multiclass':
                    const classSelected = advancement.data.length === 1;
                    const domainSelected = advancement.secondaryData;
                    advancementsDone = classSelected && domainSelected;
                    break;
            }

            if (!advancementsDone) break;
        }

        return achievementsDone && advancementsDone;
    }

    get levelSelections() {
        return Object.values(this.tiers).reduce(
            (acc, tier) => {
                acc.total += tier.selections.total;
                for (var key in tier.selections.available) {
                    const availableSelections = tier.selections.available[key];
                    acc.totalAvailable += availableSelections;

                    if (acc.available[key]) acc.available[key] += availableSelections;
                    else acc.available[key] = availableSelections;
                }

                return acc;
            },
            { total: 0, available: {}, totalAvailable: 0 }
        );
    }

    get selectionData() {
        return Object.keys(this.tiers).flatMap(tierKey => {
            const tier = this.tiers[tierKey];
            return Object.keys(tier.levels).flatMap(levelKey => {
                const level = tier.levels[levelKey];
                return Object.keys(level.optionSelections).flatMap(optionSelectionKey => {
                    const selection = level.optionSelections[optionSelectionKey];
                    const optionSelect = tier.options[optionSelectionKey];

                    return Object.keys(selection).map(checkboxNr => {
                        const selectionObj = selection[checkboxNr];
                        return {
                            tier: Number(tierKey),
                            level: Number(levelKey),
                            optionKey: optionSelectionKey,
                            type: optionSelect.type,
                            checkboxNr: Number(checkboxNr),
                            value: optionSelect.value,
                            amount: optionSelect.amount,
                            data: selectionObj.data,
                            secondaryData: selectionObj.secondaryData,
                            locked: selectionObj.locked
                        };
                    });
                });
            });
        });
    }

    get levelupData() {
        const leveledSelections = this.selectionData.reduce((acc, data) => {
            if (data.type === 'domainCard' && data.locked) return acc;
            if (!acc[data.level]) acc[data.level] = [data];
            else acc[data.level].push(data);

            return acc;
        }, {});
        return this.progressionLevels.reduce((acc, level) => {
            acc[level] = {
                domainCards: Object.values(this.domainCards).filter(x => !x.locked && x.level === level),
                selections: leveledSelections[level]
            };
            if (this.allInitialAchievements[level]) {
                acc[level].achievements = {
                    experiences: this.allInitialAchievements[level].newExperiences,
                    proficiency: this.allInitialAchievements[level].proficiency
                };
            }

            return acc;
        }, {});
    }

    /* Data to render all options from */
    get tierCheckboxGroups() {
        const multiclassSelected = Object.values(this.tiers).some(tier =>
            Object.values(tier.levels).some(level => {
                return Object.keys(level.optionSelections).some(option =>
                    Object.values(level.optionSelections[option]).some(x => option === 'multiclass' && x.selected)
                );
            })
        );
        return Object.keys(this.tiers).map(tierKey => {
            const tier = this.tiers[tierKey];
            const subclassSelected = Object.values(tier.levels).some(level => {
                return Object.keys(level.optionSelections).some(option =>
                    Object.values(level.optionSelections[option]).some(x => option === 'subclass' && x.selected)
                );
            });

            return {
                tierActive: tier.active,
                tierName: tier.name,
                groups: Object.keys(tier.options).map(optionKey => {
                    const option = tier.options[optionKey];
                    const checkboxes = [...Array(option.checkboxSelections).keys()].flatMap(checkboxNr => {
                        const levelId = Object.keys(tier.levels).find(levelKey => {
                            const optionSelect = tier.levels[levelKey].optionSelections;
                            return Object.keys(optionSelect)
                                .filter(key => key === optionKey)
                                .some(optionKey => optionSelect[optionKey][checkboxNr]?.selected);
                        });

                        const selected = Boolean(levelId);
                        const disabled = !levelId
                            ? false
                            : tier.levels[levelId].optionSelections[optionKey][checkboxNr]?.locked;
                        const multiclassDisabled =
                            !selected && optionKey === 'multiclass' && (multiclassSelected || subclassSelected);
                        return [...Array(option.minCost)].map(_ => ({
                            ...option,
                            tier: tierKey,
                            level: levelId,
                            selected: selected,
                            optionKey: optionKey,
                            checkboxNr: checkboxNr,
                            disabled: disabled || multiclassDisabled,
                            cost: option.minCost
                        }));
                    });

                    return {
                        label: game.i18n.localize(option.label),
                        checkboxGroups: chunkify(checkboxes, option.minCost, chunkedBoxes => ({
                            multi: option.minCost > 1,
                            checkboxes: chunkedBoxes
                        }))
                    };
                })
            };
        });
    }
}

class DhLevelupTier extends foundry.abstract.DataModel {
    static initializeData(levelTier, levelEndCap, pcLevelData, pcLevel) {
        const levels = {};
        for (var level = levelTier.levels.start; level <= levelEndCap; level++) {
            levels[level] = DhLevelupLevel.initializeData(
                level <= Math.min(pcLevel, levelTier.levels.end) ? levelTier.availableOptions : 0,
                levelTier.options,
                pcLevelData.filter(x => x.level === level),
                level < pcLevel
            );
        }

        var belongingLevels = [];
        for (var i = levelTier.levels.start; i <= levelTier.levels.end; i++) {
            belongingLevels.push(i);
        }

        return {
            tier: levelTier.tier,
            name: levelTier.name,
            active: pcLevel >= levelTier.levels.start,
            options: Object.keys(levelTier.options).reduce((acc, key) => {
                acc[key] = levelTier.options[key];

                return acc;
            }, {}),
            belongingLevels: belongingLevels,
            initialAchievements: levelTier.initialAchievements,
            domainCardByLevel: levelTier.domainCardByLevel,
            levels: levels
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tier: new fields.NumberField({ required: true, integer: true }),
            name: new fields.StringField({ required: true }),
            active: new fields.BooleanField({ required: true, initial: true }),
            options: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupTierOption)),
            belongingLevels: new fields.ArrayField(new fields.NumberField({ required: true, integer: true })),
            initialAchievements: new fields.SchemaField({
                experience: new fields.SchemaField({
                    nr: new fields.NumberField({ required: true, initial: 1 }),
                    modifier: new fields.NumberField({ required: true, initial: 2 })
                }),
                proficiency: new fields.NumberField({ integer: true, initial: 1 })
            }),
            domainCardByLevel: new fields.NumberField({ required: true, integer: true }),
            levels: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupLevel))
        };
    }

    get initialAchievementData() {
        return this.active ? this.initialAchievements : null;
    }

    get selections() {
        const allSelections = Object.keys(this.levels).reduce(
            (acc, key) => {
                const { selections, available } = this.levels[key].nrSelections;

                if (acc.available[key]) acc.available[key] += available;
                else acc.available[key] = available;

                acc.totalAvailable += available;
                acc.total += selections;

                return acc;
            },
            { available: {}, totalAvailable: 0, total: 0 }
        );
        return {
            available: allSelections.available,
            totalAvailable: allSelections.totalAvailable,
            total: allSelections.total
        };
    }
}

class DhLevelupTierOption extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            label: new fields.StringField({ required: true }),
            checkboxSelections: new fields.NumberField({ required: true, integer: true }),
            minCost: new fields.NumberField({ required: true, integer: true }),
            type: new fields.StringField({ required: true, choices: LevelOptionType }),
            value: new fields.NumberField({ integer: true }),
            amount: new fields.NumberField({ integer: true })
        };
    }
}

class DhLevelupLevel extends foundry.abstract.DataModel {
    static initializeData(maxSelections, optionSelections, levelData, locked) {
        return {
            maxSelections: maxSelections,
            optionSelections: levelData.reduce((acc, data) => {
                if (!acc[data.optionKey]) acc[data.optionKey] = {};
                acc[data.optionKey][data.checkboxNr] = {
                    ...data,
                    minCost: optionSelections[data.optionKey].minCost,
                    amount: optionSelections[data.optionKey].amount,
                    locked: locked
                };

                return acc;
            }, {})
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            maxSelections: new fields.NumberField({ required: true, integer: true }),
            optionSelections: new fields.TypedObjectField(
                new fields.TypedObjectField(
                    new fields.SchemaField({
                        selected: new fields.BooleanField({ required: true, initial: true }),
                        minCost: new fields.NumberField({ required: true, integer: true }),
                        amount: new fields.NumberField({ integer: true }),
                        locked: new fields.BooleanField({ required: true, initial: false }),
                        data: new fields.ArrayField(new fields.StringField()),
                        secondaryData: new fields.StringField()
                    })
                )
            )
        };
    }

    get nrSelections() {
        const selections = Object.keys(this.optionSelections).reduce((acc, optionKey) => {
            const selection = this.optionSelections[optionKey];
            acc += Object.values(selection)
                .filter(x => x.selected)
                .reduce((acc, x) => acc + x.minCost, 0);

            return acc;
        }, 0);

        return {
            selections: selections,
            available: this.maxSelections - selections
        };
    }
}
