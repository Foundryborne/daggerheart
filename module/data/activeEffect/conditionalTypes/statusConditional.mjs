import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';

export default class StatusRestrictionConditional extends foundry.abstract.DataModel {
    static get metadata() {
        return {
            phase: conditionalPhases.preparation.id,
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
                initial: conditionalTypes.status.id 
            }),
            status: new fields.StringField({
                label: 'DAGGERHEART.GENERAL.status',  
                nullable: true,
                choices: CONFIG.DH.GENERAL.conditions
            })
        }
    }

    test(rollData) { 
        if (!this.status) return true;
        
        return rollData.parent.statuses.has(this.status);
    }
}