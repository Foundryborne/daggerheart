const fields = foundry.data.fields;

export default class AreasField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 150;

    /** @inheritDoc */
    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            name: new fields.StringField({
                nullable: false,
                initial: 'Area',
                label: 'DAGGERHEART.GENERAL.name'
            }),
            type: new fields.StringField({
                nullable: false,
                choices: CONFIG.DH.ACTIONS.areaTypes,
                initial: CONFIG.DH.ACTIONS.areaTypes.placed.id,
                label: 'DAGGERHEART.GENERAL.type'
            }),
            shape: new fields.StringField({
                nullable: false,
                choices: CONFIG.DH.GENERAL.templateTypes,
                initial: CONFIG.DH.GENERAL.templateTypes.circle.id,
                label: 'DAGGERHEART.ACTIONS.Config.area.shape'
            }),
            /* Could be opened up to allow numbers to be input aswell. Probably best handled via an autocomplete in that case to allow the select options but also free text */
            size: new fields.StringField({
                nullable: false,
                choices: CONFIG.DH.GENERAL.range,
                initial: CONFIG.DH.GENERAL.range.veryClose.id,
                label: 'DAGGERHEART.ACTIONS.Config.area.size'
            }),
            effects: new fields.ArrayField(new fields.DocumentIdField())
        });
        super(element, options, context);
    }
}
