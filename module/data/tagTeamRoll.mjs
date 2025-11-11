import { DhCharacter } from './actor/_module.mjs';

export default class DhTagTeamRoll extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            initiator: new fields.SchemaField({
                id: new fields.StringField({ nullable: true, initial: null }),
                cost: new fields.NumberField({ integer: true, min: 0, initial: 3 })
            }),
            members: new fields.TypedObjectField(
                new fields.SchemaField({
                    messageId: new fields.StringField({ required: true, nullable: true, initial: null }),
                    selected: new fields.BooleanField({ required: true, initial: false })
                })
            )
        };
    }
}
