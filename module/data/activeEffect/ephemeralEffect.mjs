import BaseEffect from './baseEffect.mjs';

export default class EphemeralEffect extends BaseEffect {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            costs: new fields.ArrayField(new fields.SchemaField({
                type: new fields.StringField({
                    label: 'DAGGERHEART.ACTIVEEFFECT.Ephemeral.costType',
                    required: true,
                    nullable: false,
                    choices: CONFIG.DH.EFFECTS.ephemeralCostType,
                    initial: CONFIG.DH.EFFECTS.ephemeralCostType.hope
                }),
                value: new fields.NumberField({
                    label: 'DAGGERHEART.GENERAL.value',
                    min: 1,
                    initial: 1
                })
            }))
        }
    }

    get costLabelData() {
        if (!this.costs.length) return null;

        const costTypes = CONFIG.DH.EFFECTS.ephemeralCostType;
        if (this.costs.length === 1) {
            return {
                label: `${this.costs[0].value} ${_loc(costTypes[this.costs[0].type].label)}`,
                tooltip: null
            }
        }

        
        return {
            label: _loc('DAGGERHEART.ACTIVEEFFECT.Ephemeral.multipleCostsLabel'),
            tooltip: this.costs.map(x => _loc(costTypes[x.type].label)).join(', ') 
        }
    }
}