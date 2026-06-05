export default class GroupRollData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            leader: new fields.EmbeddedDataField(CharacterData, { nullable: true, initial: null }),
            aidingCharacters: new fields.TypedObjectField(new fields.EmbeddedDataField(CharacterData))
        };
    }

    get participants() {
        return {
            ...(this.leader ? { [this.leader.id]: this.leader } : {}),
            ...this.aidingCharacters
        };
    }
}

export class CharacterData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            id: new fields.StringField({ required: true }),
            name: new fields.StringField({ required: true }),
            img: new fields.StringField({ required: true }),
            rollChoice: new fields.StringField({
                choices: CONFIG.DH.ACTOR.abilities,
                initial: CONFIG.DH.ACTOR.abilities.agility.id
            }),
            rollData: new fields.JSONField({ nullable: true, initial: null }),
            selected: new fields.BooleanField({ initial: false }),
            successful: new fields.BooleanField({ nullable: true, initial: null })
        };
    }

    get roll() {
        return this.rollData ? CONFIG.Dice.daggerheart.DualityRoll.fromData(this.rollData) : null;
    }
}
