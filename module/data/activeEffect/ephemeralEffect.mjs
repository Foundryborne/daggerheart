import BaseEffect from './baseEffect.mjs';

export default class EphemeralEffect extends BaseEffect {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            costs: new fields.ArrayField(new fields.SchemaField({
                key: new fields.StringField({
                    label: 'DAGGERHEART.ACTIVEEFFECT.Ephemeral.costKey',
                    required: true,
                    nullable: false,
                    choices: CONFIG.DH.GENERAL.abilityCosts,
                    initial: CONFIG.DH.GENERAL.abilityCosts.hope
                }),
                value: new fields.NumberField({
                    label: 'DAGGERHEART.GENERAL.value',
                    min: 1,
                    initial: 1
                })
            }))
        }
    }
}