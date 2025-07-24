const fields = foundry.data.fields;

export class DHActionRollData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            type: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.GENERAL.rollTypes }),
            trait: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.ACTOR.abilities }),
            difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
            bonus: new fields.NumberField({ nullable: true, initial: null, integer: true }),
            advState: new fields.StringField({ choices: CONFIG.DH.ACTIONS.advandtageState, initial: 'neutral' }),
            diceRolling: new fields.SchemaField({
                multiplier: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceSetNumbers,
                    initial: 'prof',
                    label: 'Dice Number'
                }),
                flatMultiplier: new fields.NumberField({ nullable: true, initial: 1, label: 'Flat Multiplier' }),
                dice: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceTypes,
                    initial: 'd6',
                    label: 'Dice Type'
                }),
                compare: new fields.StringField({
                    choices: CONFIG.DH.ACTIONS.diceCompare,
                    initial: 'above',
                    label: 'Should be'
                }),
                treshold: new fields.NumberField({ initial: 1, integer: true, min: 1, label: 'Treshold' })
            }),
            useDefault: new fields.BooleanField({ initial: false })
        };
    }

    getFormula() {
        if (!this.type) return;
        let formula = '';
        switch (this.type) {
            case 'diceSet':
                const multiplier =
                    this.diceRolling.multiplier === 'flat'
                        ? this.diceRolling.flatMultiplier
                        : `@${this.diceRolling.multiplier}`;
                formula = `${multiplier}${this.diceRolling.dice}cs${CONFIG.DH.ACTIONS.diceCompare[this.diceRolling.compare].operator}${this.diceRolling.treshold}`;
                break;
            default:
                formula = '';
                break;
        }
        return formula;
    }
}

export default class RollField extends fields.EmbeddedDataField {
    constructor(options, context = {}) {
        super(DHActionRollData, options, context);
    }
}
