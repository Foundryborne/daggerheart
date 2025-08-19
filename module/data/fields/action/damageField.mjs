import FormulaField from '../formulaField.mjs';

const fields = foundry.data.fields;

export default class DamageField extends fields.SchemaField {
    order = 20;

    constructor(options, context = {}) {
        const damageFields = {
            parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData)),
            includeBase: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.includeBase.label'
            }),
            direct: new fields.BooleanField({ initial: false, label: 'DAGGERHEART.CONFIG.DamageType.direct.name' })
        };
        super(damageFields, options, context);
    }

    async execute(data, force = false) {
        if((this.hasRoll && DamageField.getAutomation() === CONFIG.DH.SETTINGS.actionAutomationChoices.never.id) && !force) return false;
        
        const systemData = data.system ?? data;

        let formulas = this.damage.parts.map(p => ({
            formula: DamageField.getFormulaValue.call(this, p, systemData).getFormula(this.actor),
            damageTypes: p.applyTo === 'hitPoints' && !p.type.size ? new Set(['physical']) : p.type,
            applyTo: p.applyTo
        }));

        if (!formulas.length) return false;

        formulas = DamageField.formatFormulas.call(this, formulas, systemData);

        delete systemData.evaluate;
        const config = {
            ...systemData,
            roll: formulas,
            dialog: {},
            data: this.getRollData()
        };
        if(DamageField.getAutomation() === CONFIG.DH.SETTINGS.actionAutomationChoices.always.id) config.dialog.configure = false;
        if (this.hasSave) config.onSave = this.save.damageMod;
        
        if (data.message || data.system) {
            config.source.message = data.message?._id ?? data._id;
            config.directDamage = false;
        } else {
            config.directDamage = true;
        }

        if(config.source?.message && game.modules.get('dice-so-nice')?.active)
            await game.dice3d.waitFor3DAnimationByMessageID(config.source.message);

        if(!CONFIG.Dice.daggerheart.DamageRoll.build(config)) return false;
    }
    
    static getFormulaValue(part, data) {
        let formulaValue = part.value;
        
        if (data.hasRoll && part.resultBased && data.roll.result.duality === -1) return part.valueAlt;

        const isAdversary = this.actor.type === 'adversary';
        if (isAdversary && this.actor.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
            const hasHordeDamage = this.actor.effects.find(x => x.type === 'horde');
            if (hasHordeDamage && !hasHordeDamage.disabled) return part.valueAlt;
        }

        return formulaValue;
    }

    static formatFormulas(formulas, systemData) {
        const formattedFormulas = [];
        formulas.forEach(formula => {
            if (isNaN(formula.formula))
                formula.formula = Roll.replaceFormulaData(formula.formula, this.getRollData(systemData));
            const same = formattedFormulas.find(
                f => setsEqual(f.damageTypes, formula.damageTypes) && f.applyTo === formula.applyTo
            );
            if (same) same.formula += ` + ${formula.formula}`;
            else formattedFormulas.push(formula);
        });
        return formattedFormulas;
    }

    static getAutomation() {
        return (game.user.isGM && game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.damage.gm) || (!game.user.isGM && game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.damage.players)
    }
}

export class DHActionDiceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            multiplier: new fields.StringField({
                choices: CONFIG.DH.GENERAL.multiplierTypes,
                initial: 'prof',
                label: 'Multiplier'
            }),
            flatMultiplier: new fields.NumberField({ nullable: true, initial: 1, label: 'Flat Multiplier' }),
            dice: new fields.StringField({ choices: CONFIG.DH.GENERAL.diceTypes, initial: 'd6', label: 'Dice' }),
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'Bonus' }),
            custom: new fields.SchemaField({
                enabled: new fields.BooleanField({ label: 'Custom Formula' }),
                formula: new FormulaField({ label: 'Formula', initial: '' })
            })
        };
    }

    getFormula() {
        const multiplier = this.multiplier === 'flat' ? this.flatMultiplier : `@${this.multiplier}`,
            bonus = this.bonus ? (this.bonus < 0 ? ` - ${Math.abs(this.bonus)}` : ` + ${this.bonus}`) : '';
        return this.custom.enabled ? this.custom.formula : `${multiplier ?? 1}${this.dice}${bonus}`;
    }
}

export class DHResourceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            applyTo: new fields.StringField({
                choices: CONFIG.DH.GENERAL.healingTypes,
                required: true,
                blank: false,
                initial: CONFIG.DH.GENERAL.healingTypes.hitPoints.id,
                label: 'DAGGERHEART.ACTIONS.Settings.applyTo.label'
            }),
            resultBased: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.resultBased.label'
            }),
            value: new fields.EmbeddedDataField(DHActionDiceData),
            valueAlt: new fields.EmbeddedDataField(DHActionDiceData)
        };
    }
}

export class DHDamageData extends DHResourceData {
    /** @override */
    static defineSchema() {
        return {
            ...super.defineSchema(),
            base: new fields.BooleanField({ initial: false, readonly: true, label: 'Base' }),
            type: new fields.SetField(
                new fields.StringField({
                    choices: CONFIG.DH.GENERAL.damageTypes,
                    initial: 'physical',
                    nullable: false,
                    required: true
                }),
                {
                    label: 'Type'
                }
            )
        };
    }
}
