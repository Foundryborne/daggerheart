import { omit } from '../../../helpers/functional.mjs';

const fields = foundry.data.fields;
export default class BonusAdjustment extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.EFFECTS.ChangeTypes.bonusAdjustment'];
    static defineSchema() {
        const getModeChoices = choices =>
            Object.fromEntries(choices.map(c => [c, `EFFECT.CHANGES.TYPES.${c}`]));

        const changeTypes = {
            dice: new fields.SchemaField({
                type: new fields.StringField({ required: true, choices: ['dice'], initial: 'dice' }),
                mode: new fields.StringField({
                    required: true,
                    choices: getModeChoices(Object.keys(omit(CONST.ACTIVE_EFFECT_CHANGE_TYPES, ['custom', 'multiply']))),
                    initial: 'override',
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.bonusAdjustment.FIELDS.mode.label'
                }),
                value: new fields.StringField({
                    label: 'DAGGERHEART.GENERAL.Dice.single',
                    nullable: false,
                    required: true
                })
            }, { label: 'DAGGERHEART.GENERAL.Dice.single' })
        };

        return {
            type: new fields.StringField({ required: true, choices: ['bonusAdjustment'], initial: 'bonusAdjustment' }),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
            identifier: new fields.StringField({ 
                nullable: true,
                blank: false,
                initial: null
            }),
            priority: new fields.NumberField({
                label: 'EFFECT.FIELDS.changes.element.priority.label',
                required: true, 
                integer: true
            }),
            change: new fields.TypedSchemaField(changeTypes, { initial: changeTypes.dice.getInitialValue() })
        }
    }

    static changeEffect = {
        label: 'BonusAdjustment',
        defaultPriority: 20,
        render: null,
        handler: (actor, change) => {
            const destination = actor?.system?.rules?.bonusAdjustments;
            if (!destination || !change.identifier) return;

            destination[change.identifier] ??= [];
            destination[change.identifier].push(change);
        }
    };

    static getInitialValue() {
        return this.schema.getInitialValue();
    }
}