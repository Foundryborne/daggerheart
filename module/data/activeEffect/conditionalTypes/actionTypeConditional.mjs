import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';

export default class ActionTypeConditional extends foundry.abstract.DataModel {
    static get metadata() {
        return {
            phase: conditionalPhases.roll.id,
            failureMode: conditionalFailureModes.hide.id
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
                required: true,
                nullable: false,
                choices: CONFIG.DH.EFFECTS.actionType,
                initial: null
            }), { label: 'DAGGERHEART.EFFECTS.Conditionals.actionType.actionTypes' }),
            traits: new fields.SetField(new fields.StringField({
                required: true,
                nullable: false,
                choices: CONFIG.DH.ACTOR.abilities
            }), { label: 'DAGGERHEART.GENERAL.Trait.plural' })
        }
    }

    test(rollData) {
        if (this.traits.size) {
            const trait = rollData.action?.roll?.trait;
            
            if (!this.traits.has(trait)) return false;
        }

        if (!this.actionTypes.size) return true;

        const actionType = rollData.action?.actionType;
        if (!rollData.action?.roll || !actionType) return false;
        
        if (actionType === 'action' && this.actionTypes.has(CONFIG.DH.EFFECTS.actionType.action.id))
            return true;
        if (actionType === 'reaction' && this.actionTypes.has(CONFIG.DH.EFFECTS.actionType.reaction.id))
            return true;

        return this.actionTypes.has(rollData.action.roll.type);
    }
}