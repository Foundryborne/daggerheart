import { DHDamageData } from './damageField.mjs';

const fields = foundry.data.fields;

export default class HealingField extends fields.SchemaField {
    constructor(options, context = {}) {
        const healingFields = {
            parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData))
        };
        super(healingFields, options, context);
    }
}
