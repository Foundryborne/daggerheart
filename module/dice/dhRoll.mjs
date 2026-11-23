import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import { getAllResourceLabels, triggerChatRollFx } from '../helpers/utils.mjs';
import BaseRoll from './baseRoll.mjs';

export default class DHRoll extends BaseRoll {
    baseTerms = [];

    /**
     * Creates a new Daggerheart roll
     * @param {string} formula 
     * @param {object} data 
     * @param {MoveContext | import('../data/action/_types').MoveContextParams} options 
     */
    constructor(formula, data = {}, options = {}) {
        // @todo: Consider constructing a RollConfig here if its a plain object to guarantee certain properties
        super(formula, data, foundry.utils.mergeObject(options, { roll: [] }, { overwrite: false }));
        options.bonusEffects ??= {};
        if (!this.data || !Object.keys(this.data).length) {
            this.data = options.getRollData?.() ?? options.data ?? {};
        }
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
     * @param {Partial<MoveContext>} config
     * @returns {Promise<MoveContext>}
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
        return new this(config.roll.formula, config.getRollData?.(), config);
    }

    /** 
     * @param {Partial<MoveContext>} config 
     * @returns {Promise<MoveContext>}
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
            ...roll.options.roll,
            breakdown: this.getRollBreakdown(roll, roll.options.roll, config.action)
        });
        config.evaluated = roll;
    }

    static getRollBreakdownBaseTerms() {
        return [];
    }

    static getRollBreakdown(roll, optionsData, action) {
        const baseTerms = this.getRollBreakdownBaseTerms(action);
        const modifiers = foundry.utils.deepClone(optionsData.modifiers) ?? [];

        const rollBreakdown = [];
        for (let i = 0; i < roll.terms.length; i++) {
            if (!roll.terms[i].isDeterministic) continue;

            const termTotal = roll.terms[i].total;
            if (typeof termTotal === 'number') {
                const value = (roll.terms[i - 1]?.operator === '-' ? -1 : 1) * termTotal;
                let label = _loc('DAGGERHEART.GENERAL.customModifier');

                const baseTermsIndex = baseTerms.findIndex(x => x.value === value);
                const modifierIndex = modifiers.findIndex(x => x.value === value);
                if (baseTermsIndex !== -1) {
                    label = baseTerms[baseTermsIndex].label;
                    baseTerms.splice(baseTermsIndex, 1);
                } else if (modifierIndex !== -1){
                    label = modifiers[modifierIndex].label;
                    modifiers.splice(modifierIndex, 1);
                }

                rollBreakdown.push({ label, value });
            }
        }

        return rollBreakdown;
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
            config.flags.actionChatMessageHandled ||= config.action?.chatDisplay;
            config.message = await this.toMessage(roll, config);
        }
    }

    /**
     * @param {DHRoll} roll 
     * @param {MoveContext} config
     */
    static async toMessage(roll, config) {
        config = await game.system.api.data.actions.MoveContext.build(config);
        const { actor, item, action } = config;
        let actionDescription = null;
        if (action?.chatDisplay) {
            actionDescription = action
                ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(action.description, {
                    relativeTo: config.actor,
                    rollData: config.getRollData() // should this use roll.data instead?
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
            speaker: cls.getSpeaker({ actor }),
            sound: config.flags.mute ? null : CONFIG.sounds.dice,
            system: { 
                ...foundry.utils.deepClone(config), 
                actionDescription,
                reloadCheckValue: reloadResult.rollValue,
                successConsumed: config.roll?.success
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

    /** @inheritDoc */
    async _prepareChatRenderContext({ flavor, isPrivate = false, ...options } = {}) {
        // todo: call _prepareChatRenderContext on damage rolls and then include them here
        // then move the damage types and roll tooltip to damageRoll _prepareChatRenderContext so they can be encapsulated
        // There are some quirks that have to be solved for this to be possible, for example:
        // - on damage rolls without d20/duality, this.options.damageTypes is empty, but options.system.message.damage.main.options.damageTypes isn't    
        let chatData = {};
        if (isPrivate) {
            chatData = {
                user: game.user.id,
                flavor: null,
                title: '???',
                roll: {
                    total: '??'
                },
                hasRoll: true,
                isPrivate
            };
        } else if (options.message) {
            options.message.system.user = game.user.id;
            options.message.system.allResourceLabels = getAllResourceLabels();
            chatData = options.message?.system ?? {};
        }

        const metagamingSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming);
        const automationSettings = game.system.settings.automation;

        const rollTooltip = this.options.roll ?
            await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/tooltip/rollModifiers.hbs',
                { modifiers: this.options.roll.breakdown }
            ) : null;
 
        const damageRollTooltip = chatData.damage?.main ? 
            await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/tooltip/rollModifiers.hbs',
                { modifiers: chatData.damage.main.options.breakdown }
            ) : null; 

        return {
            roll: this,
            ...chatData,
            rollTooltip,
            damageRollTooltip,
            damageTypes: chatData.damage?.main?.options?.damageTypes
                ?.map(damageType => ({
                    ...CONFIG.DH.GENERAL.damageTypes[damageType]
                }))
                .filter(Boolean),
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
        }
    }

    static getHooks(hooks) {
        return hooks ?? [];
    }

    formatModifier(modifier) {
        if (Array.isArray(modifier)) {
            return [
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(modifier.join(' + '), this.data)
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
                ...this.constructor.parse(modifier, this.data)
            ];
        }
    }

    getRollBonuses() {
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
                if (!change.key?.includes(path)) return acc;
                const changeValue = game.system.api.documents.DhActiveEffect.getChangeValue(
                    this.data,
                    change,
                    effect.origEffect
                );
                
                return Number.isNumeric(changeValue) ? acc + changeValue : acc; 
            }, 0);
        }, 0);
    }

    getBonusBreakdown() {
        const changeKeys = this.getActionChangeKeys();
        const effectBreakdown = Object.values(this.options.bonusEffects)
            .filter(effect => effect.selected)
            .map(effect => {
                const totalValue = effect.changes.reduce((acc, change) => {
                    if (!changeKeys.some(key => change.key?.includes(key))) return acc;
                    const changeValue = game.system.api.documents.DhActiveEffect.getChangeValue(
                        this.data,
                        change,
                        effect.origEffect
                    );
                    
                    return Number.isNumeric(changeValue) ? acc + Number.parseInt(changeValue) : acc; 
                }, 0);

                return { label: effect.origEffect.name, value: totalValue };
            }
            );

        return [...effectBreakdown];
    }

    getFaces(faces) {
        return Number(faces.startsWith('d') ? faces.replace('d', '') : faces);
    }

    constructFormula(config) {
        this.terms = Roll.parse(this.options.roll.formula, config.data);

        this.options.roll.modifiers = this.getRollBonuses();
        this.addModifiers();

        if (this.options.extraFormula) {
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(this.options.extraFormula, this.data)
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

    /** @param {MoveContext} config */
    static temporaryModifierBuilder(config) {
        return {};
    }
}
