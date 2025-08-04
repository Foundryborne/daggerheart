const fields = foundry.data.fields;

export class DHActionRollData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            type: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.GENERAL.rollTypes }),
            trait: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.ACTOR.abilities, label: "DAGGERHEART.GENERAL.Trait.single" }),
            difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
            bonus: new fields.NumberField({ nullable: true, initial: null, integer: true }),
            advState: new fields.StringField({
                choices: CONFIG.DH.ACTIONS.advantageState,
                initial: 'neutral'
            }),
            diceRolling: new fields.SchemaField({
                multiplier: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceSetNumbers,
                    initial: 'prof',
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.multiplier'
                }),
                flatMultiplier: new fields.NumberField({
                    nullable: true,
                    initial: 1,
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.flatMultiplier'
                }),
                dice: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceTypes,
                    initial: CONFIG.DH.GENERAL.diceTypes.d6,
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.dice'
                }),
                compare: new fields.StringField({
                    choices: CONFIG.DH.ACTIONS.diceCompare,
                    nullable: true,
                    initial: null,
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.compare'
                }),
                treshold: new fields.NumberField({
                    integer: true,
                    nullable: true,
                    initial: null,
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.threshold'
                })
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
                if (this.diceRolling.compare && this.diceRolling.treshold) {
                    formula = `${multiplier}${this.diceRolling.dice}cs${CONFIG.DH.ACTIONS.diceCompare[this.diceRolling.compare].operator}${this.diceRolling.treshold}`;
                } else {
                    formula = `${multiplier}${this.diceRolling.dice}`;
                }
                break;
            default:
                formula = '';
                break;
        }
        return formula;
    }

    getModifier() {
        const modifiers = [];
        if (!this.parent?.actor) return modifiers;
        switch (this.parent.actor.type) {
            case 'character':
                const spellcastingTrait =
                    this.type === 'spellcast'
                        ? (this.parent.actor?.system?.spellcastModifierTrait?.key ?? 'agility')
                        : null;
                const trait =
                    this.useDefault || !this.trait
                        ? (spellcastingTrait ?? this.parent.item.system.attack?.roll?.trait ?? 'agility')
                        : this.trait;
                if (
                    this.type === CONFIG.DH.GENERAL.rollTypes.attack.id ||
                    this.type === CONFIG.DH.GENERAL.rollTypes.trait.id
                )
                    modifiers.push({
                        label: `DAGGERHEART.CONFIG.Traits.${trait}.name`,
                        value: this.parent.actor.system.traits[trait].value
                    });
                else if (this.type === CONFIG.DH.GENERAL.rollTypes.spellcast.id)
                    modifiers.push({
                        label: `DAGGERHEART.CONFIG.RollTypes.spellcast.name`,
                        value: this.parent.actor.system.spellcastModifier
                    });
                break;
            case 'companion':
            case 'adversary':
                if (this.type === CONFIG.DH.GENERAL.rollTypes.attack.id)
                    modifiers.push({
                        label: 'Bonus to Hit',
                        value: this.bonus ?? this.parent.actor.system.attack.roll.bonus
                    });
                break;
            default:
                break;
        }
        return modifiers;
    }
}

export default class RollField extends fields.EmbeddedDataField {
    constructor(options, context = {}) {
        super(DHActionRollData, options, context);
    }
}
