import { AltOutcome } from './altOutcome.mjs';
import DHBaseAction from './baseAction.mjs';

const fields = foundry.data.fields;

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];

    static defineSchema() {
        return {
            ...super.defineSchema(),
            altOutcomes: new fields.SchemaField({
                successHope: new fields.EmbeddedDataField(AltOutcome, { nullable: true, initial: null }),
                successFear: new fields.EmbeddedDataField(AltOutcome, { nullable: true, initial: null }),
                failureHope: new fields.EmbeddedDataField(AltOutcome, { nullable: true, initial: null }),
                failureFear: new fields.EmbeddedDataField(AltOutcome, { nullable: true, initial: null })
            })
        };
    }

    /**
     * Return a display ready damage formula string
     * @returns Formula string
     */
    getDamageFormula() {
        const strings = [];
        for (const { value } of this.damage.parts) {
            strings.push(Roll.replaceFormulaData(value.getFormula(), this.actor?.getRollData() ?? {}));
        }

        return strings.join(' + ');
    }
}
