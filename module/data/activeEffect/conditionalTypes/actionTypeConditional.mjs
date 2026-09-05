import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';

export default class ActionTypeConditional extends foundry.abstract.DataModel {
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
                initial: conditionalTypes.actionType.id 
            }),
            actionTypes: new fields.SetField(new fields.StringField({
                label: 'DAGGERHEART.EFFECTS.Conditionals.actionType.actionType',
                nullable: true,
                choices: CONFIG.DH.EFFECTS.actionType,
                initial: null
            }))
        }
    }

    test(dhRollData) {
        if (!this.actionTypes.size) return true;

        const actionType = dhRollData.options.actionType;
        if (actionType === 'action' && this.actionTypes.has(CONFIG.DH.EFFECTS.actionType.action.id))
            return true;
        if (actionType === 'reaction' && this.actionTypes.has(CONFIG.DH.EFFECTS.actionType.reaction.id))
            return true;

        return this.actionTypes.has(dhRollData.options.roll.type);
    }
}