import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';
// TODO: Possibly add something to handle Otherwordly's case when it's implemented.
export default class DamageTypeConditional extends foundry.abstract.DataModel {
    static get metadata() {
        return {
            phase: conditionalPhases.roll.id,
            failureMode: conditionalFailureModes.remove.id
        }
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            type: new fields.StringField({ 
                label: 'DAGGERHEART.GENERAL.type',
                required: true, 
                nullable: false, 
                blank: false, 
                initial: conditionalTypes.damageType.id 
            }),
            damageType: new fields.StringField({
                label: 'DAGGERHEART.EFFECTS.Conditionals.damageType.damageType',
                required: true,
                choices: CONFIG.DH.GENERAL.damageTypes,
                initial: CONFIG.DH.GENERAL.damageTypes.physical.id
            })
        }
    }

    doesConditionalPass(actionData) { 
        if (!actionData.damage) return false;
        
        return actionData.damage.main.type.has(this.damageType)
    }
}