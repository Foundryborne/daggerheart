import { getDamageBaseFields } from '../fields/action/damageField.mjs';

const fields = foundry.data.fields;

export class AltOutcome extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            damage: new fields.SchemaField(getDamageBaseFields())
            // todo: add effects
        };
    }

    get data() {
        return {
            ...this.parent,
            ...this
        };
    }
}
