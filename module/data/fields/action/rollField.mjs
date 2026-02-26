const fields = foundry.data.fields;

export class DHActionRollData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            type: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.GENERAL.rollTypes }),
            trait: new fields.StringField({
                nullable: true,
                initial: null,
                choices: CONFIG.DH.ACTOR.abilities,
                label: 'DAGGERHEART.GENERAL.Trait.single'
            }),
            difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
            bonus: new fields.NumberField({ nullable: true, initial: null, integer: true }),
            advState: new fields.StringField({
                choices: CONFIG.DH.ACTIONS.advantageState,
                initial: 'neutral',
                nullable: false,
                required: true
            }),
            diceRolling: new fields.SchemaField({
                multiplier: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceSetNumbers,
                    initial: 'prof',
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.multiplier',
                    nullable: false,
                    required: true
                }),
                flatMultiplier: new fields.NumberField({
                    nullable: true,
                    initial: 1,
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.flatMultiplier'
                }),
                dice: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceTypes,
                    initial: CONFIG.DH.GENERAL.diceTypes.d6,
                    label: 'DAGGERHEART.ACTIONS.RollField.diceRolling.dice',
                    nullable: false,
                    required: true
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
            case 'companion':
            case 'adversary':
                if (this.type === CONFIG.DH.GENERAL.rollTypes.attack.id)
                    modifiers.push({
                        label: 'Bonus to Hit',
                        value: this.bonus ?? this.parent.actor.system.attack.roll.bonus ?? 0
                    });
                break;
            default:
                break;
        }
        return modifiers;
    }

    get rollTrait() {
        if (this.parent?.actor?.type !== 'character') return null;
        switch (this.type) {
            case CONFIG.DH.GENERAL.rollTypes.spellcast.id:
                return this.parent.actor?.system?.spellcastModifierTrait?.key ?? 'agility';
            case CONFIG.DH.GENERAL.rollTypes.attack.id:
            case CONFIG.DH.GENERAL.rollTypes.trait.id:
                return this.useDefault || !this.trait
                    ? (this.parent.item.system.attack?.roll?.trait ?? 'agility')
                    : this.trait;
            default:
                return null;
        }
    }
}

export default class RollField extends fields.EmbeddedDataField {
    /**
     * Action Workflow order
     */
    static order = 10;

    /** @inheritDoc */
    constructor(options, context = {}) {
        super(DHActionRollData, options, context);
    }

    /**
     * Roll Action Workflow part.
     * Must be called within Action context or similar.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    static async execute(config) {
        if (!config.hasRoll) return;
        config = await this.actor.diceRoll(config);
        if (!config) return false;
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    prepareConfig(config) {
        if (!config.hasRoll) return;

        config.dialog.configure = RollField.getAutomation() ? !config.dialog.configure : config.dialog.configure;

        const roll = {
            baseModifiers: this.roll.getModifier(),
            label: 'Attack',
            type: this.roll?.type,
            trait: this.roll?.rollTrait,
            difficulty: this.roll?.difficulty,
            formula: this.roll.getFormula(),
            advantage: CONFIG.DH.ACTIONS.advantageState[this.roll.advState].value
        };
        if (this.roll.type === 'diceSet' || !this.hasRoll) roll.lite = true;

        config.roll = roll;
    }

    /**
     * Return the automation setting for execute method for current user role
     * @returns {boolean} If execute should be triggered automatically
     */
    static getAutomation() {
        return (
            (game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.roll.gm) ||
            (!game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.roll.players)
        );
    }
}
