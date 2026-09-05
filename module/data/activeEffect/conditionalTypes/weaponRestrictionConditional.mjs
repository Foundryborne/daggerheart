import { conditionalTypes, conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';

export default class WeaponRestrictionConditional extends foundry.abstract.DataModel {
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
                initial: conditionalTypes.weaponRestriction.id 
            }),
            weaponType: new fields.StringField({
                label: 'DAGGERHEART.EFFECTS.Conditionals.weaponRestriction.weaponType',
                nullable: true,
                choices: CONFIG.DH.EFFECTS.weaponRestrictionType,
                initial: null
            })
        }
    }

    test(dhRollData) {
        if (!dhRollData.options.source.item) return true;
        
        const item = dhRollData.options.data.parent?.items?.get?.(dhRollData.options.source.item);
        if (!item) return true;

        if (item.type !== 'weapon') return false;

        const rollData = item.getRollData();
        const { secondary, primary, sameWeapon } = CONFIG.DH.EFFECTS.weaponRestrictionType;

        /* TODO: Replace this.parent.parent with getNearestDocument in Stable 10 */
        const weaponTypeValid = !this.weaponType || (
            (this.weaponType === sameWeapon.id && rollData.item?.parent.id === this.parent.parent?.parent.id) ||
            (this.weaponType === secondary.id && rollData.item.secondary) ||
            (this.weaponType === primary.id && !rollData.item.secondary) 
        );

        return weaponTypeValid;
    }
}