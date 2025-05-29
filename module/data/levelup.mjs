import { chunkify } from '../helpers/utils.mjs';
import { LevelOptionType } from './levelTier.mjs';

export class DhLevelup extends foundry.abstract.DataModel {
    static initializeData(levelTierData, pcLevelData) {
        const availableChoicesPerLevel = levelTierData.availableChoicesPerLevel;
        const tierKeys = Object.keys(levelTierData.tiers);
        const maxLevel = levelTierData.tiers[tierKeys[tierKeys.length - 1]].levels.end;

        return {
            tiers: tierKeys.reduce((acc, key) => {
                acc[key] = DhLevelupTier.initializeData(
                    levelTierData.tiers[key],
                    maxLevel,
                    pcLevelData.selections.filter(x => x.tier === Number(key)),
                    pcLevelData.level.changed
                );

                return acc;
            }, {}),
            maxSelections: [...Array(pcLevelData.level.changed).keys()].reduce((acc, index) => {
                const level = index + 1;
                const availableChoices = availableChoicesPerLevel[level];
                if (level > 1 && availableChoices) {
                    acc += availableChoices;
                }

                return acc;
            }, 0)
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tiers: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupTier)),
            maxSelections: new fields.NumberField({ required: true, integer: true })
        };
    }

    get levelSelections() {
        return Object.values(this.tiers).reduce(
            (acc, tier) => {
                acc.total += tier.selections.total;
                for (var key in tier.selections.available) {
                    const availableSelections = tier.selections.available[key];

                    if (acc.available[key]) acc.available[key] += availableSelections;
                    else acc.available[key] = availableSelections;
                }

                return acc;
            },
            { total: 0, available: {} }
        );
    }

    get playerData() {
        return Object.keys(this.tiers).flatMap(tierKey => {
            const tier = this.tiers[tierKey];
            return Object.keys(tier.levels).flatMap(levelKey => {
                const level = tier.levels[levelKey];
                return Object.keys(level.optionSelections).flatMap(optionSelectionKey => {
                    const selection = level.optionSelections[optionSelectionKey];
                    const optionSelect = tier.options[optionSelectionKey];

                    return Object.keys(selection).map(checkboxNr => ({
                        tier: Number(tierKey),
                        level: Number(levelKey),
                        optionKey: optionSelectionKey,
                        type: optionSelect.type,
                        checkboxNr: Number(checkboxNr),
                        value: optionSelect.value,
                        amount: optionSelect.amount
                    }));
                });
            });
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
            levels: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupLevel))
        };
    }

    get selections() {
        const allSelections = Object.keys(this.levels).reduce(
            (acc, key) => {
                const { selections, available } = this.levels[key].nrSelections;
                if (acc.available[key]) acc.available[key] += available;
                else acc.available[key] = available;
                acc.total += selections;

                return acc;
            },
            { available: {}, total: 0 }
        );
        return {
            available: allSelections.available,
            total: allSelections.total
        };
    }

    /* Data to render all options in a Tier from */
    get tierCheckboxGroups() {
        return Object.keys(this.options).map(optionKey => {
            const option = this.options[optionKey];
            const checkboxes = [...Array(option.checkboxSelections).keys()].flatMap(checkboxNr => {
                const levelId = Object.keys(this.levels).find(levelKey => {
                    const optionSelect = this.levels[levelKey].optionSelections;
                    return Object.keys(optionSelect)
                        .filter(key => key === optionKey)
                        .some(optionKey => optionSelect[optionKey][checkboxNr]?.selected);
                });

                return [...Array(option.minCost)].map(_ => ({
                    ...option,
                    tier: this.tier,
                    level: levelId,
                    selected: Boolean(levelId),
                    optionKey: optionKey,
                    checkboxNr: checkboxNr,
                    disabled: !levelId ? false : this.levels[levelId].optionSelections[optionKey][checkboxNr]?.locked,
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
        });
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
                    minCost: optionSelections[data.optionKey].minCost,
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
                        locked: new fields.BooleanField({ required: true, initial: false })
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
