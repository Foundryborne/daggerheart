import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import { getAllResourceLabels, triggerChatRollFx } from '../helpers/utils.mjs';
import { RollConfig } from './_module.mjs';
import BaseRoll from './baseRoll.mjs';

export default class DHRoll extends BaseRoll {
    baseTerms = [];

    /**
     * Creates a new Daggerheart roll
     * @param {string} formula 
     * @param {object} data 
     * @param {RollConfig | import('./_types').RollConfigParams} options 
     */
    constructor(formula, data = {}, options = {}) {
        // @todo: Consider constructing a RollConfig here if its a plain object to guarantee certain properties
        super(formula, data, foundry.utils.mergeObject(options, { roll: [] }, { overwrite: false }));

        if (!this.data || !Object.keys(this.data).length) this.data = options.data;
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.GENERAL.Roll.basic');
    }

    get modifierTotal() {
        return this.constructor.calculateTotalModifiers(this);
    }

    static messageType = 'adversaryRoll';

    static CHAT_TEMPLATE = 'systems/daggerheart/templates/ui/chat/roll.hbs';

    static DefaultDialog = D20RollDialog;

    /**
     * @param {Partial<RollConfig>} config
     * @returns {Promise<RollConfig>}
     */
    static async build(config = {}, message = {}) {
        const roll = await this.buildConfigure(config, message);
        if (!roll) return;

        if (config.skips?.createMessage) config.messageRoll = roll;

        if (config.evaluate !== false) {
            await this.buildEvaluate(roll, config, message);
        }
        await this.buildPost(roll, config, message);
        return config;
    }

    static createRollInstance(config) {
        return new this(config.roll.formula, config.data, config);
    }

    /** 
     * @param {Partial<RollConfig>} config 
     * @returns {Promise<RollConfig>}
     */
    static async buildConfigure(config = {}, message = {}) {
        config.hooks = [...this.getHooks(), ''];
        for (const hook of config.hooks) {
            if (Hooks.call(`${CONFIG.DH.id}.preRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        this.temporaryModifierBuilder(config);

        let roll = this.createRollInstance(config);
        if (config.dialog.configure !== false) {
            // Open Roll Dialog
            const DialogClass = config.dialog?.class ?? this.DefaultDialog;
            const configDialog = await DialogClass.configure(roll, config, message);
            if (!configDialog) return;
        }

        for (const hook of config.hooks) {
            if (
                Hooks.call(`${CONFIG.DH.id}.post${hook.capitalize()}RollConfiguration`, roll, config, message) === false
            )
                return [];
        }
        return roll;
    }

    /** 
     * Evaluates the roll and assigns roll data into the config. 
     * This is only called if config.evaluate is not set to false
     * @protected
     */
    static async buildEvaluate(roll, config = {}, message = {}) {
        await roll.evaluate();
        config.roll = foundry.utils.deepClone({
            ...config.roll,
            ...roll.options.roll
        });
        config.evaluated = roll;
    }

    /** 
     * Runs any post configuration events that need to happen towards the end, such as hooks and dice so nice 
     * @protected
     */
    static async buildPost(roll, config, message) {
        for (const hook of config.hooks) {
            if (Hooks.call(`${CONFIG.DH.id}.postRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        if (config.skips?.createMessage) {
            await triggerChatRollFx([roll]);
        } else if (!config.source?.message) {
            config.message = await this.toMessage(roll, config);
            config.actionChatMessageHandled ||= config.action?.chatDisplay;
        }
    }

    /**
     * @param {DHRoll} roll 
     * @param {RollConfig} config
     */
    static async toMessage(roll, config) {
        config = await RollConfig.build(config);
        const { item, action } = config;
        let actionDescription = null;
        if (action?.chatDisplay) {
            actionDescription = action
                ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(action.description, {
                    relativeTo: config.actor,
                    rollData: config.getRollData()
                })
                : null;
        }

        const reloadSetting = game.system.settings.automation.reload;
        const useReload = 
            item?.system.hasReload && 
            action?.type === 'attack' && 
            reloadSetting === CONFIG.DH.SETTINGS.reloadChoices.auto.id;
        const reloadResult = useReload ? await action?.handleReload?.() : {};
        
        const cls = getDocumentClass('ChatMessage');
        const msgData = {
            type: this.messageType,
            user: game.user.id,
            title: roll.title,
            speaker: cls.getSpeaker({ actor: roll.data?.parent }),
            sound: config.mute ? null : CONFIG.sounds.dice,
            system: { 
                ...foundry.utils.deepClone(config), 
                actionDescription,
                reloadCheckValue: reloadResult.rollValue 
            },
            rolls: [roll]
        };

        if (roll._evaluated) {
            const message = await cls.create(msgData, { messageMode: config.selectedMessageMode });

            if (roll.formula !== '' && game.dice3d) {
                await game.dice3d.waitFor3DAnimationByMessageID(message.id);
            }

            return message;
        } else return msgData;
    }

    // TODO - Possibly remove this completly if actorRoll.renderHTML implementation can take over getting the chatData prepared.
    /** @inheritDoc */
    async render({ flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false, ...options } = {}) {
        if (!this._evaluated) return;

        const metagamingSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming);
        const automationSettings = game.system.settings.automation;
        const chatData = await this._prepareChatRenderContext({ flavor, isPrivate, ...options });
        return foundry.applications.handlebars.renderTemplate(template, {
            roll: this,
            ...chatData,
            targetData: chatData.hasTarget ? {
                currentTargets: chatData._getCurrentTargets(),
                selectedTargetsData: chatData._getSelectedTargetsData()
            } : null,
            action: chatData.action,
            parent: chatData.parent,
            targetMode: chatData.targetMode,
            areas: chatData.action?.areas,
            appliesEffects: chatData.appliesEffects,
            metagamingSettings,
            automationSettings
        });
    }

    /** @inheritDoc */
    async _prepareChatRenderContext({ flavor, isPrivate = false, ...options } = {}) {
        if (isPrivate) {
            return {
                user: game.user.id,
                flavor: null,
                title: '???',
                roll: {
                    total: '??'
                },
                hasRoll: true,
                isPrivate
            };
        } else {
            options.message.system.user = game.user.id;
            options.message.system.allResourceLabels = getAllResourceLabels();
            return options.message.system;
        }
    }

    static getHooks(hooks) {
        return hooks ?? [];
    }

    formatModifier(modifier) {
        if (Array.isArray(modifier)) {
            return [
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(modifier.join(' + '), this.options.data)
            ];
        } else if (Number.isNumeric(modifier)) {
            const numTerm = modifier < 0 ? '-' : '+';
            return [
                new foundry.dice.terms.OperatorTerm({ operator: numTerm }),
                new foundry.dice.terms.NumericTerm({ number: Math.abs(modifier) })
            ];
        } else {
            const numTerm = modifier < 0 ? '-' : '+';
            return [
                new foundry.dice.terms.OperatorTerm({ operator: numTerm }),
                ...this.constructor.parse(modifier, this.options.data)
            ];
        }
    }

    applyBaseBonus() {
        return [];
    }

    addModifiers(roll) {
        roll = roll ?? this.options.roll;
        roll.modifiers?.forEach(m => {
            this.terms.push(...this.formatModifier(m.value));
        });
    }

    /**
     * Sums the values of all instances of ActiveEffect.change values from the toggleable bonusEffects of the roll 
     * that match a given change.key partial path. Only for use on ActiveEffects.change with strictly numerical values.
     * @param {string} path The full or partial effect.change key 
     * @returns {number}
     */
    getTotalBonus(path) {
        return Object.values(this.options.bonusEffects).reduce((acc, effect) => {
            if (!effect.selected) return acc;
            return acc + effect.changes.reduce((acc, change) => {
                if (!change.key.includes(path)) return acc;
                const changeValue = game.system.api.documents.DhActiveEffect.getChangeValue(
                    this.data,
                    change,
                    effect.origEffect
                );
                
                return Number.isNumeric(changeValue) ? acc + changeValue : acc; 
            }, 0);
        }, 0);
    }

    /**
     * Grabs all instances of ActiveEffect.change values from the toggleable bonusEffects of the roll 
     * that match a given change.key partial path.
     * @param {string} path The full or partial effect.change key 
     * @param {string} label The label to give the modifiers
     * @returns {[{ label: string, value: any} ]}
     */
    getBonus(path, label) {
        const modifiers = [];
        for (const effect of Object.values(this.options.bonusEffects)) {
            if (!effect.selected) continue;
            for (const change of effect.changes) {
                if (!change.key.includes(path)) continue;
                
                // TODO: We should handle override and all other modes. It'll have to be done in a different way
                // as we cannot just go through each change and sum them up. We'll have to get the total value with
                // overrides and everything considered.
                if (!['add', 'subtract'].includes(change.type)) continue;

                const changeValue = game.system.api.documents.DhActiveEffect.getChangeValue(
                    this.data,
                    change,
                    effect.origEffect
                );
                const typedValue = change.type === 'add' ? changeValue : -changeValue;
                modifiers.push({ label: label, value: typedValue });
            }
        }

        return modifiers;
    }

    getFaces(faces) {
        return Number(faces.startsWith('d') ? faces.replace('d', '') : faces);
    }

    constructFormula(config) {
        this.terms = Roll.parse(this.options.roll.formula, config.data);

        this.options.roll.modifiers = this.applyBaseBonus();
        this.addModifiers();

        if (this.options.extraFormula) {
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(this.options.extraFormula, this.options.data)
            );
        }
        return (this._formula = this.constructor.getFormula(this.terms));
    }

    /**
     * Calculate total modifiers of any rolls, including non-dh rolls.
     * This exists because damage rolls still may receive base roll classes
     */
    static calculateTotalModifiers(roll) {
        let modifierTotal = 0;
        for (let i = 0; i < roll.terms.length; i++) {
            if (!roll.terms[i].isDeterministic) continue;
            const termTotal = roll.terms[i].total;
            if (typeof termTotal === 'number') {
                const multiplier = roll.terms[i - 1]?.operator === '-' ? -1 : 1;
                modifierTotal += multiplier * termTotal;
            }
        }

        return modifierTotal;
    }

    /** @param {RollConfig} config */
    static temporaryModifierBuilder(config) {
        return {};
    }

    /** 
     * Returns the change keys associated with this roll class.
     * @returns {string[]} 
     */
    static getActionChangeKeys() {
        return [];
    }
}
