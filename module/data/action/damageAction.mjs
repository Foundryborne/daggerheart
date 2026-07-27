import { DHResourceBaseData } from '../fields/action/damageField.mjs';
import FormulaField from '../fields/formulaField.mjs';
import IterableTypedObjectField from '../fields/iterableTypedObjectField.mjs';
import DHBaseAction from './baseAction.mjs';

const fields = foundry.data.fields;

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];
    
    static defineSchema() {
        return {
            ...super.defineSchema(),
            altOutcomes: new fields.SchemaField({
                successHope: new IterableTypedObjectField(
                    DHSimpleResourceData, 
                    { collectionClass: foundry.utils.Collection, nullable: true, initial: null }),
                successFear: new IterableTypedObjectField(
                    DHSimpleResourceData, 
                    { collectionClass: foundry.utils.Collection, nullable: true, initial: null }),
                failureHope: new IterableTypedObjectField(
                    DHSimpleResourceData, 
                    { collectionClass: foundry.utils.Collection, nullable: true, initial: null }),
                failureFear: new IterableTypedObjectField(
                    DHSimpleResourceData, 
                    { collectionClass: foundry.utils.Collection, nullable: true, initial: null })
            })
        };
    }

    /**
     * Return a display ready damage formula string
     * @returns Formula string
     */
    getDamageFormula() {
        if (!this.damage.main) return '';

        return Roll.replaceFormulaData(this.damage.main.value.getFormula(), this.actor?.getRollData() ?? {});
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

class DHSimpleResourceData extends DHResourceBaseData {
    /** @override */
    static defineSchema() {
        return {
            ...super.defineSchema(),
            value: new fields.EmbeddedDataField(DHActionValueData)
        };
    }
}