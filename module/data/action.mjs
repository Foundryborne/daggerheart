export default class DaggerheartAction extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            id: new fields.StringField({}),
            name: new fields.StringField({ initial: 'New Action' }),
            damage: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.damageTypes, nullable: true, initial: null }),
                value: new fields.StringField({})
            }),
            healing: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.healingTypes, nullable: true, initial: null }),
                value: new fields.StringField()
            }),
            conditions: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    icon: new fields.StringField(),
                    description: new fields.StringField()
                })
            ),
            cost: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.abilityCosts, nullable: true, initial: null }),
                value: new fields.NumberField({ nullable: true, initial: null })
            }),
            target: new fields.SchemaField({
                type: new fields.StringField({
                    choices: SYSTEM.ACTIONS.targetTypes,
                    initial: SYSTEM.ACTIONS.targetTypes.other.id
                })
            })
            // uses: new fields.SchemaField({
            //     nr: new fields.StringField({}),
            //     refreshType: new fields.StringField({ choices: SYSTEM.GENERAL.refreshTypes, initial: SYSTEM.GENERAL.refreshTypes.session.id }),
            //     refreshed: new fields.BooleanField({ initial: true }),
            // }),
        };
    }

    use = async () => {
        console.log('Test Use');
    };
}
