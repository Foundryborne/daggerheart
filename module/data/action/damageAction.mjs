import DHBaseAction from './baseAction.mjs';

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];

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
