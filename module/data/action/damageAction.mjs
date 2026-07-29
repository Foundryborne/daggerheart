import DHBaseAction from './baseAction.mjs';
import { DamageAltOutcome } from './subDatas/altOutcome.mjs';

const fields = foundry.data.fields;

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];
    
    static defineSchema() {
        return {
            ...super.defineSchema(),
            altOutcomes: new fields.SchemaField({
                successHope: new DamageAltOutcome(),
                successFear: new DamageAltOutcome(),
                failureHope: new DamageAltOutcome(),
                failureFear: new DamageAltOutcome()
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