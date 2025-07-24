import { DHDamageData } from './damageField.mjs';

const fields = foundry.data.fields;

export default class HealingField extends fields.EmbeddedDataField {
    constructor(options, context = {}) {
        super(DHDamageData, options, context);
    }
}
