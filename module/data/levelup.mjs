import { LevelOptionType } from './levelTier.mjs';

export class DhLevelup extends foundry.abstract.DataModel {
    static initializeData(levelTierData, pcLevelData) {
        const availableChoicesPerLevel = levelTierData.availableChoicesPerLevel;

        return {
            tiers: Object.keys(levelTierData.tiers).reduce((acc, key) => {
                acc[key] = DhLevelupTier.initializeData(
                    levelTierData.tiers[key],
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
                for (var key in tier.selections.selections) {
                    const nrSelections = tier.selections.selections[key];

                    if (acc.selections[key]) acc.selections[key] += nrSelections;
                    else acc.selections[key] = nrSelections;
                }

                return acc;
            },
            { total: 0, selections: {} }
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
    static initializeData(levelTier, pcLevelData, pcLevel) {
        const levels = {};
        const levelEndCap = levelTier.levels.end + 1;
        for (var level = levelTier.levels.start; level < levelEndCap; level++) {
            levels[level] = DhLevelupLevel.initializeData(
                levelTier.availableOptions,
                pcLevelData.filter(x => x.level === level)
            );
        }

        return {
            tier: levelTier.tier,
            name: levelTier.name,
            active: pcLevel >= levelTier.levels.start,
            options: Object.keys(levelTier.options).reduce((acc, key) => {
                acc[key] = levelTier.options[key];

                return acc;
            }, {}),
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
            levels: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupLevel))
        };
    }

    get selections() {
        const allSelections = Object.keys(this.levels).reduce((acc, key) => {
            acc[key] = this.levels[key].nrSelections;

            return acc;
        }, {});
        return {
            selections: allSelections,
            total: Object.values(allSelections).reduce((acc, nr) => acc + nr, 0)
        };
    }

    /* Data to render all options in a Tier from */
    get tierCheckboxGroups() {
        return Object.keys(this.options).map(optionKey => {
            const option = this.options[optionKey];
            return {
                label: game.i18n.localize(option.label),
                checkboxes: [...Array(option.checkboxQuantity).keys()].map(checkboxNr => {
                    const levelId = Object.keys(this.levels).find(levelKey => {
                        const optionSelect = this.levels[levelKey].optionSelections;
                        return Object.keys(optionSelect)
                            .filter(key => key === optionKey)
                            .some(optionKey => optionSelect[optionKey][checkboxNr]);
                    });
                    return {
                        ...option,
                        tier: this.tier,
                        level: levelId,
                        selected: Boolean(levelId),
                        optionKey: optionKey,
                        checkboxNr: checkboxNr
                    };
                })
            };
        });
    }
}

class DhLevelupTierOption extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            label: new fields.StringField({ required: true }),
            checkboxQuantity: new fields.NumberField({ required: true, integer: true }),
            minCost: new fields.NumberField({ required: true, integer: true }),
            type: new fields.StringField({ required: true, choices: LevelOptionType }),
            value: new fields.NumberField({ integer: true }),
            amount: new fields.NumberField({ integer: true })
        };
    }
}

class DhLevelupLevel extends foundry.abstract.DataModel {
    static initializeData(maxSelections, levelData) {
        return {
            maxSelections: maxSelections,
            optionSelections: levelData.reduce((acc, data) => {
                if (!acc[data.optionkey]) acc[data.optionKey] = {};
                acc[data.optionKey][data.checkboxNr] = true;

                return acc;
            }, {})
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            maxSelections: new fields.NumberField({ required: true, integer: true }),
            optionSelections: new fields.TypedObjectField(
                new fields.TypedObjectField(new fields.BooleanField({ required: true, initial: true }))
            )
        };
    }

    get nrSelections() {
        return Object.keys(this.optionSelections).reduce(
            (acc, optionKey) => acc + Object.keys(this.optionSelections[optionKey]).length,
            0
        );
    }
}
