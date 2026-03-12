export default class TagTeamData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            members: new fields.TypedObjectField(new fields.EmbeddedDataField(MemberData))
        };
    }
}

class MemberData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            name: new fields.StringField({ required: true }),
            img: new fields.StringField({ required: true }),
            rollType: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.tagTeamRollTypes,
                initial: CONFIG.DH.GENERAL.tagTeamRollTypes.trait.id,
                label: 'Roll Type'
            }),
            rollChoice: new fields.StringField({ nullable: true, initial: null }),
            rollData: new fields.JSONField({ nullable: true, initial: null }),
            selected: new fields.BooleanField({ initial: false })
        };
    }

    get roll() {
        return this.rollData ? CONFIG.Dice.daggerheart.DualityRoll.fromData(this.rollData) : null;
    }
}
