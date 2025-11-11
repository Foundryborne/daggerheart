import FormulaField from '../formulaField.mjs';
import { setsEqual } from '../../../helpers/utils.mjs';

const fields = foundry.data.fields;

export default class DamageField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 20;

    /** @inheritDoc */
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

    /**
     * Roll Damage/Healing Action Workflow part.
     * Must be called within Action context or similar.
     * @param {object} config               Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {string} [messageId=null]     ChatMessage Id where the clicked button belong.
     * @param {boolean} [force=false]       If the method should be executed outside of Action workflow, for ChatMessage button for example.
     */
    static async execute(config, messageId = null, force = false) {
        if (!this.hasDamage && !this.hasHealing) return;
        if (
            this.hasRoll &&
            DamageField.getAutomation() === CONFIG.DH.SETTINGS.actionAutomationChoices.never.id &&
            !force
        )
            return;

        let formulas = this.damage.parts.map(p => ({
            formula: DamageField.getFormulaValue.call(this, p, config).getFormula(this.actor),
            damageTypes: p.applyTo === 'hitPoints' && !p.type.size ? new Set(['physical']) : p.type,
            applyTo: p.applyTo
        }));

        if (!formulas.length) return false;

        formulas = DamageField.formatFormulas.call(this, formulas, config);

        const damageConfig = {
            ...config,
            roll: formulas,
            dialog: {},
            data: this.getRollData()
        };
        delete damageConfig.evaluate;

        if (DamageField.getAutomation() === CONFIG.DH.SETTINGS.actionAutomationChoices.always.id)
            damageConfig.dialog.configure = false;
        if (config.hasSave) config.onSave = damageConfig.onSave = this.save.damageMod;

        damageConfig.source.message = config.message?._id ?? messageId;
        damageConfig.directDamage = !!damageConfig.source?.message;

        // if(damageConfig.source?.message && game.modules.get('dice-so-nice')?.active)
        //     await game.dice3d.waitFor3DAnimationByMessageID(damageConfig.source.message);

        const damageResult = await CONFIG.Dice.daggerheart.DamageRoll.build(damageConfig);
        if (!damageResult) return false;
        config.damage = damageResult.damage;
        config.message ??= damageConfig.message;
    }

    /**
     * Apply Damage/Healing Action Worflow part.
     * @param {object} config        Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {*[]} targets     Arrays of targets to bypass pre-selected ones.
     * @param {boolean} force   If the method should be executed outside of Action workflow, for ChatMessage button for example.
     */
    static async applyDamage(config, targets = null, force = false) {
        targets ??= config.targets.filter(target => target.hit);
        if (!config.damage || !targets?.length || (!DamageField.getApplyAutomation() && !force)) return;

        const targetDamage = [];
        const damagePromises = [];
        for (let target of targets) {
            const actor = foundry.utils.fromUuidSync(target.actorId);
            if (!actor) continue;
            if (!config.hasHealing && config.onSave && target.saved?.success === true) {
                const mod = CONFIG.DH.ACTIONS.damageOnSave[config.onSave]?.mod ?? 1;
                Object.entries(config.damage).forEach(([k, v]) => {
                    v.total = 0;
                    v.parts.forEach(part => {
                        part.total = Math.ceil(part.total * mod);
                        v.total += part.total;
                    });
                });
            }

            const token = game.scenes.find(x => x.active).tokens.find(x => x.id === target.id);
            if (config.hasHealing)
                damagePromises.push(
                    actor.takeHealing(config.damage).then(updates => targetDamage.push({ token, updates }))
                );
            else
                damagePromises.push(
                    actor
                        .takeDamage(config.damage, config.isDirect)
                        .then(updates => targetDamage.push({ token, updates }))
                );
        }

        Promise.all(damagePromises).then(async _ => {
            const summaryMessageSettings = game.settings.get(
                CONFIG.DH.id,
                CONFIG.DH.SETTINGS.gameSettings.Automation
            ).summaryMessages;
            if (!summaryMessageSettings.damage) return;

            const cls = getDocumentClass('ChatMessage');
            const msg = {
                type: 'systemMessage',
                user: game.user.id,
                speaker: cls.getSpeaker(),
                title: game.i18n.localize(
                    `DAGGERHEART.UI.Chat.damageSummary.${config.hasHealing ? 'healingTitle' : 'title'}`
                ),
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/ui/chat/damageSummary.hbs',
                    {
                        targets: targetDamage
                    }
                )
            };

            cls.create(msg);
        });
    }

    /**
     * Return value or valueAlt from damage part
     * Must be called within Action context or similar.
     * @param {object} part Damage Part
     * @param {object} data Action getRollData
     * @returns Formula value object
     */
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

    /**
     * Prepare formulas for Damage Roll
     * Must be called within Action context or similar.
     * @param {object[]} formulas   Array of formatted formulas object
     * @param {object} data         Action getRollData
     * @returns
     */
    static formatFormulas(formulas, data) {
        const formattedFormulas = [];
        formulas.forEach(formula => {
            if (isNaN(formula.formula))
                formula.formula = Roll.replaceFormulaData(formula.formula, this.getRollData(data));
            const same = formattedFormulas.find(
                f => setsEqual(f.damageTypes, formula.damageTypes) && f.applyTo === formula.applyTo
            );
            if (same) same.formula += ` + ${formula.formula}`;
            else formattedFormulas.push(formula);
        });
        return formattedFormulas;
    }

    /**
     * Return the automation setting for execute method for current user role
     * @returns {string} Id from settingsConfig.mjs actionAutomationChoices
     */
    static getAutomation() {
        return (
            (game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.damage.gm) ||
            (!game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.damage.players)
        );
    }

    /**
     * Return the automation setting for applyDamage method for current user role
     * @returns {boolean} If applyDamage should be triggered automatically
     */
    static getApplyAutomation() {
        return (
            (game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.damageApply.gm) ||
            (!game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.damageApply.players)
        );
    }
}

export class DHActionDiceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            multiplier: new fields.StringField({
                choices: CONFIG.DH.GENERAL.multiplierTypes,
                initial: 'prof',
                label: 'DAGGERHEART.ACTIONS.Config.damage.multiplier',
                nullable: false,
                required: true
            }),
            flatMultiplier: new fields.NumberField({
                nullable: true,
                initial: 1,
                label: 'DAGGERHEART.ACTIONS.Config.damage.flatMultiplier'
            }),
            dice: new fields.StringField({
                choices: CONFIG.DH.GENERAL.diceTypes,
                initial: 'd6',
                label: 'DAGGERHEART.GENERAL.Dice.single',
                nullable: false,
                required: true
            }),
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'DAGGERHEART.GENERAL.bonus' }),
            custom: new fields.SchemaField({
                enabled: new fields.BooleanField({ label: 'DAGGERHEART.ACTIONS.Config.general.customFormula' }),
                formula: new FormulaField({ label: 'DAGGERHEART.ACTIONS.Config.general.formula', initial: '' })
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
