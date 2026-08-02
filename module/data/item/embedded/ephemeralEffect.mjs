import FormulaField from '../../fields/formulaField.mjs';

export default class EphemeralEffect extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        
        return {
            id: new fields.StringField({ required: true, nullable: false }),
            name: new fields.StringField({ 
                label: 'DAGGERHEART.GENERAL.name',
                required: true, 
                nullable: false 
            }),
            img: new fields.FilePathField({
                required: true,
                nullable: false,
                categories: ['IMAGE'],
                base64: false,
                initial: 'icons/skills/movement/arrows-up-trio-red.webp'
            }),
            /* Itterable object to ensure only one of each type? */
            costs: new fields.ArrayField(new fields.SchemaField({
                type: new fields.StringField({ 
                    label: 'DAGGERHEART.GENERAl.type',
                    required: true, 
                    nullable: false, 
                    choices: CONFIG.DH.GENERAL.healingTypes, 
                    initial: CONFIG.DH.GENERAL.healingTypes.hitPoints 
                }),
                value: new fields.NumberField({ 
                    label: 'DAGGERHEART.GENERAL.value',
                    required: true, 
                    integer: true, min: 1, 
                    initial: 1 
                }),
                scalable: new fields.BooleanField({
                    label: 'DAGGERHEART.GENERAL.scalable',
                    required: true,
                    nullable: false,
                    initial: false
                }),
                step: new fields.NumberField({
                    label: 'DAGGERHEART.GENERAL.step',
                    nullable: true,
                    integer: true,
                    initial: null,
                    step: 1
                })
            })),
            timing: new fields.StringField({
                label: 'DAGGERHEART.EPHEMERAl.FIELDS.timing.label',
                required: true,
                nullable: false,
                choices: CONFIG.DH.EPHEMERAL.EphemeralTiming,
                initial: CONFIG.DH.EPHEMERAL.EphemeralTiming.duringRoll.id
            }),
            type: new fields.StringField({ 
                label: 'DAGGERHEART.EPHEMERAL.FIELDS.type.label',
                required: true, 
                nullable: false, 
                choices: CONFIG.DH.EPHEMERAL.EphemeralType, 
                initial: CONFIG.DH.EPHEMERAL.EphemeralType.roll.id 
            }),
            bonusValue: new FormulaField({
                label: 'DAGGERHEART.EPHEMERAL.FIELDS.bonusValue.label',
                deterministic: false
            }),
            effectData: new fields.SchemaField({
                applyOnSuccessfullSave: new fields.BooleanField({ 
                    label: 'DAGGERHEART.EPHEMERAL.FIELDS.effectData.applyOnSuccessfullSave.label',
                    required: true, 
                    nullable: false, 
                    initial: false 
                }), 
                effects: new fields.ArrayField(new fields.SchemaField({
                    id: new fields.StringField({ required: true, nullable: false }),
                    uuid: new fields.StringField({ required: true, nullable: false })
                }))
            })
        }
    }

    get costLabelData() {
        if (!this.costs.length) return null;

        const costTypes = CONFIG.DH.GENERAL.healingTypes;
        if (this.costs.length === 1) {
            return {
                label: `${this.costs[0].value} ${_loc(costTypes[this.costs[0].type].label)}`,
                tooltip: null
            }
        }

        
        return {
            label: _loc('DAGGERHEART.EPHEMERAL.multipleCostsLabel'),
            tooltip: this.costs.map(x => _loc(costTypes[x.type].label)).join(', ') 
        }
    }
}