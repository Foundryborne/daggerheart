const fields = foundry.data.fields;

export default class DHSummonField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 120;

    constructor(options = {}, context = {}) {
        const summonFields = new fields.SchemaField({
            actorUUID: new fields.DocumentUUIDField({
                type: 'Actor',
                required: true
            }),
            count: new fields.NumberField({
                required: true,
                default: 1,
                min: 1,
                integer: true
            })
        });
        super(summonFields, options, context);
    }

    static async execute(config) {
        console.log('something');
    }
}
