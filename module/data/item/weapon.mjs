import BaseDataItem from './base.mjs';
import FormulaField from '../fields/formulaField.mjs';
import PseudoDocumentsField from '../fields/pseudoDocumentsField.mjs';
import BaseFeatureData from '../pseudo-documents/feature/baseFeatureData.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHWeapon extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.weapon',
            type: 'weapon',
            hasDescription: true,
            isQuantifiable: true,
            embedded: {
                feature: 'featureTest'
            }
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            equipped: new fields.BooleanField({ initial: false }),

            //SETTINGS
            secondary: new fields.BooleanField({ initial: false }),
            trait: new fields.StringField({ required: true, choices: SYSTEM.ACTOR.abilities, initial: 'agility' }),
            range: new fields.StringField({ required: true, choices: SYSTEM.GENERAL.range, initial: 'melee' }),
            burden: new fields.StringField({ required: true, choices: SYSTEM.GENERAL.burden, initial: 'oneHanded' }),
            //DAMAGE
            damage: new fields.SchemaField({
                value: new FormulaField({ initial: 'd6' }),
                type: new fields.StringField({
                    required: true,
                    choices: SYSTEM.GENERAL.damageTypes,
                    initial: 'physical'
                })
            }),
            feature: new fields.StringField({ choices: SYSTEM.ITEM.weaponFeatures, blank: true }),
            featureTest: new PseudoDocumentsField(BaseFeatureData, {
                required: true,
                nullable: true,
                max: 1,
                validTypes: ['weapon']
            }),
            actions: new fields.ArrayField(new ActionField())
        };
    }
}
