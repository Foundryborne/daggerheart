import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';

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
            damageTypes: new fields.SetField(new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.damageTypes
            }), { label: 'DAGGERHEART.EFFECTS.Conditionals.damageType.damageTypes' })
        }
    }

    doesConditionalPass(actionData) { 
        if (!actionData.damage) return false;
        
        return Boolean(actionData.damage.main.type.intersection(this.damageTypes).size);
    }
}