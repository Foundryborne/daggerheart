const fields = foundry.data.fields;

export default class RangeField extends fields.StringField {
    /** @inheritDoc */
    constructor(context = {}) {
        const options = {
            choices: CONFIG.DH.GENERAL.range,
            required: false,
            blank: true,
            label: 'DAGGERHEART.GENERAL.range'
        };
        super(options, context);
    }

    /**
     * Update Action Workflow config object.
     * NOT YET IMPLEMENTED.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    prepareConfig(config) {
        return;
    }
}
