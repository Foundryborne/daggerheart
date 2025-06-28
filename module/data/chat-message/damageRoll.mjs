export default class DHDamageRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            messageType: new fields.StringField({initial: 'damage'}),
            title: new fields.StringField(),
            roll: new fields.DataField({}),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    actorId: new fields.StringField({}),
                    name: new fields.StringField(),
                    img: new fields.StringField(),
                    hit: new fields.BooleanField({ initial: false }),
                    saved: new fields.SchemaField({
                        result: new fields.NumberField(),
                        success: new fields.BooleanField({ nullable: true, initial: null })
                    })
                })
            ),
            hasSave: new fields.BooleanField({ initial: false }),
            onSave: new fields.StringField(),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField(),
                message: new fields.StringField()
            }),
            directDamage: new fields.BooleanField({initial: true})
        };
    }

    get messageTemplate() {
        return `systems/daggerheart/templates/chat/${this.messageType}-roll.hbs`;
    }
}
