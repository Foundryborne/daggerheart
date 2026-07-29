import DHBaseAction from './baseAction.mjs';

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];

    /**
     * Return a display ready damage formula string
     * @returns Formula string
     */
    getDamageFormula() {
        if (!this.damage.main) return '';

        return Roll.replaceFormulaData(this.damage.main.value.getFormula(), this.actor?.getRollData() ?? {});
    }
}
