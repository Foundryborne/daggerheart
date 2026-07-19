import FormulaField from '../formulaField.mjs';
import { setsEqual } from '../../../helpers/utils.mjs';
import IterableTypedObjectField from '../iterableTypedObjectField.mjs';

const fields = foundry.data.fields;

export default class DamageField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 20;

    /** @inheritDoc */
    constructor(options, context = {}) {
        super({
            main: new fields.EmbeddedDataField(DHDamageData, { nullable: true }),
            resources: new IterableTypedObjectField(DHResourceData)
        }, options, context);
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
        ) {
            return;
        }

        const damageFormula = this.damage.main ? 
            DamageField.formatFormulas.call(this, [this.damage.main], config)[0] : null;
        const resourceFormulas = DamageField.formatFormulas.call(this, this.damage.resources, config);

        if (!damageFormula && !resourceFormulas.length) return false;

        messageId = config.message?._id ?? messageId;
        const message = game.messages.get(messageId);
        const damageConfig = {
            dialog: {},
            ...config,
            damageFormula,
            resourceFormulas, 
            data: this.getRollData(),
            isCritical: Boolean(message?.system.roll?.isCritical)
        };
        delete damageConfig.evaluate;

        if (DamageField.getAutomation() === CONFIG.DH.SETTINGS.actionAutomationChoices.always.id)
            damageConfig.dialog.configure = false;
        if (config.hasSave) config.onSave = damageConfig.onSave = this.save.damageMod;

        damageConfig.source.message = messageId;
        damageConfig.directDamage = !!damageConfig.source?.message;

        const damageResult = await CONFIG.Dice.daggerheart.DamageRoll.build(damageConfig);
        if (!damageResult) return false;
        if (damageResult.actionChatMessageHandled) config.actionChatMessageHandled = true;

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
        for (const target of targets) {
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

            const token = target.id
                ? game.scenes.find(x => x.active).tokens.find(x => x.id === target.id)
                : actor.prototypeToken;
            if (config.hasHealing)
                damagePromises.push(
                    actor.takeHealing(config.damage).then(updates => targetDamage.push({ token, updates }))
                );
            else {
                const configDamage = config.damage.clone();
                configDamage.main &&= configDamage.main.toJSON();
                if (configDamage.main) {
                    const multiplier = config.actionActor?.system.rules?.attack?.damage?.hpDamageMultiplier ?? 1;
                    const takenMultiplier = actor.system.rules?.attack?.damage?.hpDamageTakenMultiplier;
                    configDamage.main.total = Math.ceil(config.damage.main.total * multiplier * takenMultiplier);
                }

                damagePromises.push(
                    actor
                        .takeDamage(configDamage, config.isDirect)
                        .then(updates => targetDamage.push({ token, updates }))
                );
            }
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
        const isHorde = this.actor.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id;
        if (isAdversary && isHorde && this.roll?.isStandardAttack) {
            const hasHordeDamage = this.actor.effects.find(x => x.type === 'horde');
            if (hasHordeDamage && !hasHordeDamage.disabled) return part.valueAlt;
        }

        return formulaValue;
    }

    /**
     * Prepare formulas for Damage Roll
     * Must be called within Action context or similar.
     * @param {DHResourceData[]} damageData  Array of DHResourceData
     * @param {object} data         Action getRollData
     * @returns
     */
    static formatFormulas(damageData, data) {
        const formulas = damageData.map(x => ({
            formula: DamageField.getFormulaValue.call(this, x, data).getFormula(this.actor),
            damageTypes: x.type ?? new Set(),
            applyTo: x.applyTo
        }));

        const formattedFormulas = [];
        for (const formula of formulas) {
            if (isNaN(formula.formula))
                formula.formula = Roll.replaceFormulaData(formula.formula, this.getRollData(data));
            const same = formattedFormulas.find(
                f => setsEqual(f.damageTypes, formula.damageTypes) && f.applyTo === formula.applyTo
            );
            if (same) same.formula += ` + ${formula.formula}`;
            else formattedFormulas.push(formula);
        }

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

    static getGroupAttackTokens(actorId, range) {
        if (!canvas.scene) return [];

        const targets = Array.from(game.user.targets);
        const rangeSettings = canvas.scene?.rangeSettings;
        if (!rangeSettings) return [];

        const maxDistance = rangeSettings[range];
        return canvas.scene.tokens.filter(x => {
            if (x.actor?.id !== actorId) return false;
            if (targets.every(target => x.object.distanceTo(target) > maxDistance)) return false;

            return true;
        });
    }
}

export class DHActionDiceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            multiplier: new fields.StringField({
                choices: CONFIG.DH.GENERAL.multiplierTypes,
                initial: 'flat',
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
                initial: CONFIG.DH.GENERAL.diceTypes.d6,
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

    /**
     * @returns {string} the formula associated with this damage field
     */
    getFormula() {
        if (this.custom.enabled) return this.custom.formula;

        const multiplier = this.multiplier === 'flat' ? this.flatMultiplier : `@${this.multiplier}`;
        if (!multiplier) return String(this.bonus || 0);

        const dice = `${multiplier ?? 1}${this.dice}`;
        const sign = this.bonus < 0 ? ' - ' : ' + ';
        return this.bonus ? `${dice} ${sign} ${Math.abs(this.bonus)}` : dice;
    }
}

export class DHResourceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            base: new fields.BooleanField({ initial: false, readonly: true, label: 'Base' }),
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
            includeBase: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.includeBase.label'
            }),
            direct: new fields.BooleanField({ initial: false, label: 'DAGGERHEART.CONFIG.DamageType.direct.name' }),
            groupAttack: new fields.StringField({
                choices: CONFIG.DH.GENERAL.groupAttackRange,
                blank: true,
                label: 'DAGGERHEART.ACTIONS.Settings.groupAttack.label'
            }),
            type: new fields.SetField(
                new fields.StringField({
                    choices: CONFIG.DH.GENERAL.damageTypes,
                    initial: 'physical',
                    nullable: false,
                    required: true
                }),
                {
                    label: game.i18n.localize('DAGGERHEART.GENERAL.type')
                }
            )
        };
    }
}
