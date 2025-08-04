const fields = foundry.data.fields;

export default class RangeField extends fields.StringField {
    constructor(context = {}) {
        const options = {
            choices: CONFIG.DH.GENERAL.range,
            required: false,
            blank: true,
            label: "DAGGERHEART.GENERAL.range"
        };
        super(options, context);
    }

    static prepareConfig(config) {
        return true;
    }
}
