import { LevelOptionType } from './levelTier.mjs';

export class DhLevelup extends foundry.abstract.DataModel {
    static initializeData(levelTierData, levelChoices) {
        return {
            tiers: Object.keys(levelTierData.tiers).reduce((acc, key) => {
                acc[key] = DhLevelupTier.initializeData(levelTierData.tiers[key]);

                return acc;
            }, {})
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tiers: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupTier))
        };
    }

    get totalSelections() {
        return Object.values(this.tiers).reduce((acc, tier) => acc + tier.nrSelections, 0);
    }
}

class DhLevelupTier extends foundry.abstract.DataModel {
    static initializeData(levelTier, levelChoices) {
        const levels = {};
        const levelEndCap = levelTier.levels.end + 1;
        for (var level = levelTier.levels.start; level < levelEndCap; level++) {
            levels[level] = DhLevelupLevel.initializeData(levelTier.availableOptions, levelTier.options);
        }

        return {
            tier: levelTier.tier,
            name: levelTier.name,
            options: Object.keys(levelTier.options).reduce((acc, key) => {
                acc[key] = levelTier.options[key];

                return acc;
            }, {}),
            levels: levels,
            maxSelections: levelTier.availableOptions * (levelEndCap - levelTier.levels.start)
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tier: new fields.NumberField({ required: true, integer: true }),
            name: new fields.StringField({ required: true }),
            options: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupTierOption)),
            levels: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelupLevel)),
            maxSelections: new fields.NumberField({ required: true, integer: true })
        };
    }

    get nrSelections() {
        return Object.values(this.levels).reduce((acc, level) => acc + level.nrSelections, 0);
    }

    /* Data to render all options in a Tier from */
    get tierCheckboxGroups() {
        return Object.keys(this.options).map(optionKey => {
            const option = this.options[optionKey];
            return {
                label: game.i18n.localize(option.label),
                checkboxes: [...Array(option.checkboxQuantity).keys()].map(checkboxNr => {
                    const levelId = Object.keys(this.levels).find(levelKey => {
                        Object.values(this.levels[levelKey].optionSelections).some(nr => nr === checkboxNr);
                    });
                    return {
                        ...option,
                        tier: this.tier,
                        level: levelId,
                        selected: Boolean(levelId),
                        optionkey: optionKey,
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
    static initializeData(maxSelections, levelOptions, levelChoices) {
        return {
            maxSelections: maxSelections,
            optionSelections: {} // collate levelOption and levelChoices,
        };
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            maxSelections: new fields.NumberField({ required: true, integer: true }),
            optionSelections: new fields.TypedObjectField(
                new fields.SchemaField({
                    checkboxNr: new fields.NumberField({ required: true, integer: true })
                })
            )
        };
    }

    get nrSelections() {
        return this.optionSelections.length;
    }
}
