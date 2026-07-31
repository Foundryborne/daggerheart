import { DHResourceBaseData } from '../../fields/action/damageField.mjs';
import IterableTypedObjectField from '../../fields/iterableTypedObjectField.mjs';

export class DamageAltOutcome extends foundry.data.fields.SchemaField {
    constructor(options = {}, context = {}) {
        super(
            { resources: new IterableTypedObjectField(DHSimpleResourceData) },
            { ...options, nullable: true, initial: null },
            context
        );
    }
}

const fields = foundry.data.fields;

class DHSimpleResourceData extends DHResourceBaseData {
    /** @override */
    static defineSchema() {
        return {
            ...super.defineSchema(),
            value: new fields.EmbeddedDataField(DHActionValueData)
        };
    }
}

class DHActionValueData extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'DAGGERHEART.GENERAL.bonus' })
        }
    }

    /** Static fields for compatability with DHActionDiceData */
    get multiplier() {
        return 'flat';
    }

    get flatMultiplier() {
        return 0;
    }

    get dice() {
        return CONFIG.DH.GENERAL.diceTypes.d6;
    }
}