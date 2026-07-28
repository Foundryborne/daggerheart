import { DHResourceBaseData } from '../../fields/action/damageField.mjs';
import FormulaField from '../../fields/formulaField.mjs';
import IterableTypedObjectField from '../../fields/iterableTypedObjectField.mjs';

export class AltOutcome extends IterableTypedObjectField {
    constructor(type = DHSimpleResourceData, options = {}, context = {}) {
        super(
            type, 
            { ...options, collectionClass: foundry.utils.Collection, nullable: true, initial: null },
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
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'DAGGERHEART.GENERAL.bonus' }),
            custom: new fields.SchemaField({
                enabled: new fields.BooleanField({ label: 'DAGGERHEART.ACTIONS.Config.general.customFormula' }),
                formula: new FormulaField({ label: 'DAGGERHEART.ACTIONS.Config.general.formula', initial: '' })
            })
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