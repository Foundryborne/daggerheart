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
     * @param {boolean} successfull 
     * @param {boolean} withHope
     * @returns {{ main: DHDamageData, resources: { key: string, value: DHResourceData } }}
     */
    getDamageOutcome(successfull, withHope) {
        const outcome = { main: this.damage.main, resources: this.damage.resources };

        if (successfull && withHope && this.altOutcomes.successHope) {
            outcome.resources = this.altOutcomes.successHope.resources;
        } else if (successfull && !withHope && this.altOutcomes.successFear) {
            outcome.resources = this.altOutcomes.successFear.resources;
        } else if (!successfull && withHope && this.altOutcomes.failureHope) {
            outcome.resources = this.altOutcomes.failureHope.resources;
        } else if (!successfull && !withHope && this.altOutcomes.failureFear){
            outcome.resources = this.altOutcomes.failureFear.resources;
        }

        return outcome;
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