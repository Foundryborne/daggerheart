import { LevelOptionType } from './levelTier.mjs';

export default class DhLevelData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            level: new fields.SchemaField({
                current: new fields.NumberField({ required: true, integer: true, initial: 1 }),
                changed: new fields.NumberField({ required: true, integer: true, initial: 1 }),
                bonuses: new fields.TypedObjectField(new fields.NumberField({ integer: true, nullable: false }))
            }),
            levelups: new fields.TypedObjectField(
                new fields.SchemaField({
                    achievements: new fields.SchemaField(
                        {
                            experiences: new fields.TypedObjectField(
                                new fields.SchemaField({
                                    name: new fields.StringField({ required: true }),
                                    modifier: new fields.NumberField({ required: true, integer: true })
                                })
                            ),
                            domainCards: new fields.ArrayField(
                                new fields.SchemaField({
                                    uuid: new fields.StringField({ required: true }),
                                    itemUuid: new fields.StringField({ required: true })
                                })
                            ),
                            proficiency: new fields.NumberField({ integer: true })
                        },
                        { nullable: true, initial: null }
                    ),
                    selections: new fields.ArrayField(
                        new fields.SchemaField({
                            tier: new fields.NumberField({ required: true, integer: true }),
                            level: new fields.NumberField({ required: true, integer: true }),
                            optionKey: new fields.StringField({ required: true }),
                            type: new fields.StringField({ required: true, choices: LevelOptionType }),
                            checkboxNr: new fields.NumberField({ required: true, integer: true }),
                            value: new fields.NumberField({ integer: true }),
                            minCost: new fields.NumberField({ integer: true }),
                            amount: new fields.NumberField({ integer: true }),
                            data: new fields.ArrayField(new fields.StringField({ required: true })),
                            secondaryData: new fields.TypedObjectField(new fields.StringField({ required: true })),
                            itemUuid: new fields.DocumentUUIDField({ required: true }),
                            featureIds: new fields.ArrayField(new fields.StringField())
                        })
                    )
                })
            )
        };
    }

    get actions() {
        return Object.values(this.levelups).flatMap(level => level.selections.flatMap(s => s.actions));
    }

    get canLevelUp() {
        return this.level.current < this.level.changed;
    }
}
