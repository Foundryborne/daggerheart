import DHBaseAction from './baseAction.mjs';

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];

    prepareData() {
        super.prepareData();
        
        const parentBaseDamage = this.getParentHitPointDamage();
        if (this.damage?.main && parentBaseDamage) {
            if (this.damage.main.includeBase) {
                if (!this.damage.main) {
                    this.damage.main = parentBaseDamage;
                } else {
                    for (const type of parentBaseDamage.type) this.damage.main.type.add(type);

                    const actionDamage = this.damage.main.value.hasFormula ? 
                        null : this.damage.main.value.getFormula();
                    this.damage.main.value.custom = {
                        enabled: true,
                        formula: `${parentBaseDamage.value.getFormula()}${actionDamage ? ` + ${actionDamage}` : ''}`
                    };
                }
            }
        }
    }

    getParentHitPointDamage() {
        return this.item?.system.attack?.damage.main ?? this.item.parent?.system.attack?.damage.main;
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
