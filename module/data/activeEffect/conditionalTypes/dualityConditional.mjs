import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';

export default class DualityConditional extends foundry.abstract.DataModel {
    static get metadata() {
        return {
            phase: conditionalPhases.roll.id,
            failureMode: conditionalFailureModes.suppress.id
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
                initial: conditionalTypes.duality.id 
            }),
            dualityType: new fields.StringField({
                label: 'DAGGERHEART.EFFECTS.Conditionals.duality.dualityType',
                required: true,
                nullable: false,
                choices: CONFIG.DH.EFFECTS.dualityType,
                initial: CONFIG.DH.EFFECTS.dualityType.hope.id
            })
        }
    }

    test(rollData) {
        const roll = rollData.message?.system.roll;
        if (!roll) return false;


        if (this.dualityType === CONFIG.DH.EFFECTS.dualityType.hope.id)
            return roll.withHope;
        
        return roll.withFear;
    }
}