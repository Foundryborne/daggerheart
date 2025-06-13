export default class DHAdversaryRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            title: new fields.StringField(),
            origin: new fields.StringField({ required: true }),
            dice: new fields.DataField(),
            roll: new fields.DataField(),
            modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.NumberField({ integer: true }),
                    label: new fields.StringField({})
                })
            ),
            advantageState: new fields.BooleanField({ nullable: true, initial: null }),
            advantage: new fields.SchemaField({
                dice: new fields.StringField({}),
                value: new fields.NumberField({ integer: true })
            }),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({}),
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    difficulty: new fields.NumberField({ integer: true, nullable: true }),
                    evasion: new fields.NumberField({ integer: true }),
                    hit: new fields.BooleanField({ initial: false })
                })
            ),
            damage: new fields.SchemaField(
                {
                    value: new fields.StringField({}),
                    type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false })
                },
                { nullable: true, initial: null }
            )
        };
    }

    prepareDerivedData() {
        this.targets.forEach(target => {
            target.hit = target.difficulty ? this.total >= target.difficulty : this.total >= target.evasion;
        });
    }
}
