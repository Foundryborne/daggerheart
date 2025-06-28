const fields = foundry.data.fields;

export default class DHDualityRoll extends foundry.abstract.TypeDataModel {
    static dualityResult = {
        hope: 1,
        fear: 2,
        critical: 3
    };

    static defineSchema() {
        return {
            title: new fields.StringField(),
            roll: new fields.DataField({}),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({}),
                    actorId: new fields.StringField({}),
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    difficulty: new fields.NumberField({ integer: true, nullable: true }),
                    evasion: new fields.NumberField({ integer: true }),
                    hit: new fields.BooleanField({ initial: false }),
                    saved: new fields.SchemaField({
                        result: new fields.NumberField(),
                        success: new fields.BooleanField({ nullable: true, initial: null })
                    })
                })
            ),
            hasDamage: new fields.BooleanField({ initial: false }),
            hasHealing: new fields.BooleanField({ initial: false }),
            hasEffect: new fields.BooleanField({ initial: false }),
            hasSave: new fields.BooleanField({ initial: false }),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField()
            })
        };
    }

    get messageTemplate() {
        return 'systems/daggerheart/templates/chat/duality-roll.hbs';
    }
}
