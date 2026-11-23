import { ResourceUpdateMap } from '../actor/resource-update-map.mjs';
import { omit } from '../../helpers/functional.mjs';
import D20Roll from '../../dice/d20Roll.mjs';

/** @import DHBaseAction from './baseAction.mjs'; */

/** 
 * Action specific state/context for a specific use of an action.
 */
export class MoveContext {
    /**
     * 
     * @param {import('./_types').MoveContextParams} data RollConfig data or creation data for one 
     * @param {object} options  Resolved document types for overrides. 
     *                          Mostly used to pass the event without mutation or in build() after parsing the source data. 
     * @param {Event} [options.event]
     * @param {DhActor} [options.actor]
     * @param {DhItem} [options.item]
     * @param {DHBaseAction} [options.action]
     */
    constructor(data = {}, { actor, item, action } = {}) {
        // Store documents and resolve missing 
        /** @type {DHBaseAction | null} */
        this.action = action ??= data.action ?? null;
        /** @type {DhActor | null} */
        this.actor = actor ??= data.actor ?? data.action?.actor ?? data.item?.actor ?? null;
        /** @type {DhItem | null} */
        this.item = item ??= data.item ?? data.action?.item ?? null;
        this.message = data.message;
        this.event ??= data.event;
        
        // Redirect to the partner if companion. Ideally we shouldn't do this and keep it on the partner,
        // but the system as a whole expects the partner to be the main roll.
        // todo: make it work somehow in the dice
        const partner = this.actor?.system?.partner;
        if (partner) {
            this.companion = this.actor;
            this.actor = partner;
        }

        // Passthrough certain props. This allows RollConfigs to be recreated
        this.title = data.title ?? _loc(action?.name);
        this.headerTitle = data.headerTitle;
        this.actionType = data.actionType ?? action?.actionType ?? 'action';
        this.groupAction = data.groupAction;

        this.selectedMessageMode = data.selectedMessageMode ?? game.settings.get('core', 'messageMode');
        this.tierLimit = data.tierLimit;
        this.modifications = data.modifications;
        this.targets = data.targets ?? [];
        this.countdowns = data.countdowns;
        this.skips = foundry.utils.mergeObject({
            // @todo remove and make it a diceRoll() prop instead. This is not used in move context, just specific roll functions
            resources: false,
            triggers: false,
            createMessage: false,
            updateCountdowns: false,
            reaction: false
        }, data.skips ?? {});
        this.damageOptions = data.damageOptions ?? {};

        /** The list of selected experiences for the roll. Changes in the dialog. */
        this.experiences = data.experiences ?? [];
        /** The list of selected costs. Consumed via spendResources() and changes in the dialog */
        this.costs = data.costs ?? [];
        /** The uses that will be spent by this context */
        this.uses = data.uses ?? {};
        /** Resolved bonus effect data, mostly to restore selected status */
        this.bonusEffects = data.bonusEffects ?? {};
        /** Resolved bonus effect data for damage, mostly to restore selected status */
        this.damageEffects = data.damageEffects ?? {};
        
        // Initialize props based on the documents and action
        // todo: determine which ones we can kill. hasTarget may need an alternative solution
        this.hasSave = Boolean(action?.hasSave);
        this.hasDamage = Boolean(action?.hasDamage || data.damageFormula);
        this.hasEffect = Boolean(action?.hasEffect);
        this.hasTarget = data.hasTarget ?? Boolean(action?.hasTarget); // targetField sets it to true, even though the action has it to false TODO: can we check targets?
        this.hasHealing = Boolean(action?.hasHealing);
        this.onSave = action?.save?.damageMod;
        this.isDirect = false;
        this.targetUuid = action?.targetUuid;
        /** Evaluated main roll @type {InstanceType<typeof game.system.api.dice.DHRoll>} */
        this.evaluated = data.evaluated ?? null;
        this.evaluate = action ? this.hasRoll : null; // todo: determine use and see if action filter is required

        /** Data used to configure the roll. The actual is in evaluated. @type {import('./_types').MoveRollProps | null} */
        this.roll = data.roll ?? 
            (data.hasRoll === false || !action?.hasRoll || this.roll === null ? null : action?.roll ?? {});
        this.damageFormula = data.damageFormula;
        this.resourceFormulas = data.resourceFormulas;
        this.hasRoll = Boolean(this.roll);
        
        this.damage = data.damage;
        
        this.resourceUpdates = new ResourceUpdateMap(this.actor);
        this.dialog = {}; // updated when keybindings are applied

        const damage = action?.damage;
        if (actor && damage) {
            this.isDirect = damage.main?.direct;
            const groupAttackTokens = damage.main?.groupAttack
                ? game.system.api.fields.ActionFields.DamageField.getGroupAttackTokens(
                    actor.id,
                    damage.main.groupAttack
                )
                : null;
            this.damageOptions.groupAttack ??= damage.main?.groupAttack
                ? {
                    numAttackers: Math.max(groupAttackTokens.length, 1),
                    range: damage.main.groupAttack
                }
                : null;
        }

        this.source = {
            actor: actor?.uuid,
            item: item?.id,
            action: action?.id,
            originItem: action?.originItem
        };

        /** 
         * Processing flags. Not part of the move, but tracks information about its usage.
         * Maybe also be used to perform auxiliary handling that isn't part of resolving a move (like muting the roll sound)
         * @type {import('./_types').MoveFlags}
         */
        this.flags = foundry.utils.mergeObject({
            actionChatMessageHandled: false,
            resourcesSpent: false,
            mute: false
        }, data.flags ?? {});
    }

    /** @deprecated */
    get data() {
        foundry.utils.logCompatibilityWarning('MoveContext#data is deprecated. Use MoveContext#getRollData() instead', { since: '2.12.8' })
        return this.getRollData();
    }

    /**
     * @returns {typeof CONFIG.Dice.daggerheart[keyof typeof CONFIG.Dice.daggerheart]}
     */
    get rollClass() {
        if (!this.roll) return CONFIG.Dice.daggerheart['DHRoll'];

        const rollClass = this.roll.lite
            ? 'DHRoll'
            : this.roll.fateType
                ? 'FateRoll'
                : this.actor?.rollClass?.name ?? (this.roll.type === 'trait' ? 'DualityRoll' : 'DHRoll');
        return CONFIG.Dice.daggerheart[rollClass] ?? CONFIG.Dice.daggerheart['DHRoll'];
    }

    getRollData() {
        const data = this.action?.getRollData() ?? this.item?.getRollData() ?? this.actor?.getRollData() ?? {};
        data.experiences = this.companion?.system?.experiences ?? this.actor?.system.experiences ?? {};
        data.traits ??= {};
        data.rules ??= {};
        data.action ??= {
            actionType: this.actionType, 
            roll: this.roll
        };
        data.scale = this.costs?.length // Right now only return the first scalable cost.
            ? (this.costs.find(c => c.scalable)?.total ?? 1)
            : 1;

        return data;
    }

    /** 
     * Perform data sanitation and get data based on current parameters.
     * Can be called after making changes to data in order to re-initialize using new data.
     */
    async initialize() {
        // Acquire bonus effects for the main roll and damage, so that we can start getting modifiers
        // todo: support bonus effects defined in data that don't come from effects somehow
        this.bonusEffects = this.#mergeBonusEffects(this.bonusEffects, this.roll ? this.#extractEffects('roll') : {});
        this.damageEffects = this.#mergeBonusEffects(this.damageEffects, this.hasDamage || this.hasHealing ? this.#extractEffects(this.hasHealing ? 'healing' : 'damage') : {}); // todo: include healing
        
        const rollData = this.getRollData();

        // Extract Roll and damage modifiers
        if (this.roll) {
            this.roll.modifiers = foundry.utils.deepClone(this.roll.baseModifiers) ?? [];
            this.roll.modifiers.push(...this.#extractModifiers('roll', { rollData }));
            const actorExperiences = rollData.experiences;
            for (const m of this.experiences?.filter(m => !!actorExperiences[m]) ?? []) {
                this.roll.modifiers.push({
                    label: actorExperiences[m].name,
                    value: actorExperiences[m].value
                });
            }
        }
        if (this.damageFormula) {
            const type = this.hasHealing ? 'healing' : 'damage';
            this.damageFormula.modifiers = this.#extractModifiers(type, { rollData });
        }

        this.guaranteedCritical = this.actor?.appliedEffects.reduce((a, c) => {
            const change = c.system.changes.find(ch => ch.key === 'system.rules.roll.guaranteedCritical');
            if (change) a = true;
            return a;
        }, false);
        if (this.guaranteedCritical) {
            this.dialog.configure = false;
        }

        if (this.costs && this.actor) {
            // todo: consider deleting calcCosts and handling all sanitization here. A lot of the bind logic is confusing to follow
            const CostField = game.system.api.fields.ActionFields.CostField;
            this.costs = CostField.calcCosts.call(this.action?.actor ? this.action : { actor: this.actor }, this.costs);
        }

        if (this.uses) {
            this.uses.value ??= 0;
            this.uses.remaining = this.action?.remainingUses;
            this.uses.enabled ??= true;
        }

        // Apply configure prop, but only if not set to allow overrides
        // todo: should this be a thing in skips?
        const event = this.event;
        this.dialog.configure ??= !event || !(event.shiftKey || event.altKey || event.ctrlKey)

        // Determine advantage mode
        if (this.roll) {
            const keys = {
                normal: event && (event.shiftKey || event.altKey || event.ctrlKey),
                advantage: Boolean(event?.altKey),
                disadvantage: Boolean(event?.ctrlKey)
            };

            const advantage = this.roll.advantage === D20Roll.ADV_MODE.ADVANTAGE || keys.advantage || this.advantage;
            const disadvantage =
                this.roll.advantage === D20Roll.ADV_MODE.DISADVANTAGE || keys.disadvantage || this.disadvantage;
            this.roll.advantage = advantage && !disadvantage
                ? D20Roll.ADV_MODE.ADVANTAGE :
                !advantage && disadvantage
                    ? D20Roll.ADV_MODE.DISADVANTAGE
                    : D20Roll.ADV_MODE.NORMAL;
        }
    }

    /** 
     * Tests if the costs can be sufficiently paid for by the actor
     * @returns {boolean}
     */
    testSufficientResources() {
        if (!this.costs) return true;

        const actionLike = this.action ?? { actor: this.actor };

        const CostField = game.system.api.fields.ActionFields.CostField;
        const realCosts = CostField.getRealCosts.call(actionLike, this.costs);
        const hasFearCost = realCosts.findIndex(c => c.key === 'fear');

        if (hasFearCost > -1) {
            const fearCost = realCosts.splice(hasFearCost, 1)[0];
            if (
                !game.user.isGM ||
                fearCost.total > game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear)
            )
                return false;
        }

        /* isReversed is a sign that the resource is inverted, IE it counts upwards instead of down */
        const resources = CostField.getResources.call(actionLike, realCosts);
        return realCosts.reduce(
            (a, c) =>
                !resources[c.key]
                    ? a
                    : a && resources[c.key].isReversed
                        ? resources[c.key].value + (c.total ?? c.value) <= resources[c.key].max
                        : resources[c.key]?.value >= (c.total ?? c.value),
            true
        );
    }

    /** 
     * Tests if there are sufficient uses for this action
     * @returns {boolean}
     */
    testSufficientUses() {
        if (!this.uses) return true;

        const uses = this.uses;
        let max = uses.max ?? 0;
        if (isNaN(max)) {
            const roll = new Roll(Roll.replaceFormulaData(uses.max, this.getRollData())).evaluateSync();
            max = roll.total;
        }
        return (uses.hasOwnProperty('enabled') && !uses.enabled) || uses.value + 1 <= max;
    }

    /** 
     * Spend all costs and uses, and whatever else may have been added to resourceUpdates
     * @param {object} [options]
     * @param {boolean} [options.successCost=false]     Consume only resources configured as "On Success only"
     */
    async spendResources({ successCost = false, alwaysConsume = false } = {}) {
        if (!this.actor) return; // nothing to spend resources on

        const CostField = game.system.api.fields.ActionFields.CostField;
        const actor = this.actor.system.partner ?? this.actor;
        const usefulResources = {
            ...foundry.utils.deepClone(actor.system.resources),
            fear: {
                value: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear),
                max: game.system.settings.homebrew.maxFear,
                reversed: false
            }
        };

        // Include item costs
        const item = this.item;
        if (item) {
            for (const cost of this.costs) {
                if (cost.itemId) {
                    usefulResources[cost.key] = {
                        value: cost.value,
                        target: item,
                        itemId: cost.itemId
                    };
                }
            }
        }

        const isSuccess = this.roll?.success; // is this the right property?
        const resources = CostField.getRealCosts(this.costs)
            .filter(
                c =>
                    alwaysConsume ||
                    (!successCost && (!c.consumeOnSuccess || isSuccess)) ||
                    (successCost && c.consumeOnSuccess)
            )
            .reduce((a, c) => {
                const resource = usefulResources[c.key];
                if (resource) {
                    a.push({
                        key: c.key,
                        value: (c.total ?? c.value) * (resource.isReversed ? 1 : -1),
                        target: resource.target,
                        itemId: resource.itemId
                    });
                }

                return a;
            }, []);

        this.resourceUpdates.addResources(resources);
        await this.resourceUpdates.updateResources();

        if (
            this.action &&
            this.uses?.enabled &&
            (alwaysConsume || 
                (!successCost && (!this.uses?.consumeOnSuccess || isSuccess)) ||
                (successCost && this.uses?.consumeOnSuccess))
        ) {
            await this.action.update({ 'uses.value': this.action.uses.value + 1 });
        }

        this.flags.resourcesSpent = true;
    }

    static async build(data, options = {}) {
        // If this is already a RollConfig and there are no options, do a passthrough
        // This allows passing users to pass plain objects to functions that expect a RollConfig.
        // Do not change this behavior without careful consideration - the code likes to bolt on props and they could be lost
        // todo: initialize if not already initialized
        if (data instanceof MoveContext && foundry.utils.isEmpty(options)) {
            return data;
        }

        if (data.source) {
            options.actor ??= data.actor ?? await fromUuid(data.source.actor);
            options.item ??= data.item ?? options.actor?.items.get(data.source.item);
            // todo: support action. Currently none of this is needed as getters resolve it, but we might eventually need it
            // It might be handly to make a getter to resolve actor/item/action from source data, as action has multiple cases
            // Check actorRoll.mjs for implementation
        }

        const config = new this(data, options);
        await config.initialize();
        return config;
    }

    toJSON() {
        // MoveContext is pasted to roll.options. We don't want certain properties to get serialized in the roll
        // We can't omit "data" yet until we reduce reliance on it
        return omit(this, ['actor', 'item', 'action', 'effects', 'event', 'evaluated']);
    }

    /**
     * Reads effects to return a list of toggleable bonus effects for the roll
     * @param {"roll" | "damage" | "healing"} type 
     * @returns {Record<string, import('./_types').MoveBonusEffect>} toggleable bonus effects for the type of roll
     */
    #extractEffects(type) {
        if (!this.actor) return {};

        const rollData = this.getRollData();
        const applicableEffects = this.actor.allApplicableEffects({ noTransferArmor: true, noSelfArmor: true });
        const effects = [...applicableEffects].filter(e => !e.isSuppressed).reduce((acc, effect) => {
            const conditionalPassed = effect.system.testConditionals(rollData, { 
                phase: CONFIG.DH.EFFECTS.conditionalPhases.roll.id 
            });
            if (conditionalPassed)
                acc.push(effect);

            return acc;
        }, []);
        
        const changeKeys = [`system.bonuses.${type}`];
        if (type === 'damage' || type === 'healing') changeKeys.push('system.rules.attack.damage.hpDamageMultiplier');

        return (effects ?? []).reduce((acc, effect) => {
            if (!(effect instanceof ActiveEffect)) return acc;

            const conditionalsPassed = rollData && effect.system?.testConditionals?.(rollData, { phase: 'roll' });

            // Some old v13 messages don't have system data and will cause errors here during roll construction otherwise. TODO. See if message.roll.options.effects can be saved/instantiated as actual ActiveEffects, then this can be removed.
            if (
                conditionalsPassed && 
                (effect.system.changes ?? []).some(x => changeKeys.some(key => x.key?.includes(key)))
            ) {
                acc[effect.id] = {
                    id: effect.id,
                    name: effect.name,
                    description: effect.description,
                    changes: effect.system.changes,
                    origEffect: effect,
                    selected: !effect.disabled
                };
            }

            return acc;
        }, {});
    }

    /**
     * Grabs all instances of ActiveEffect.change values from the toggleable bonusEffects of the roll 
     * that match a given change.key partial path.
     * @param {"roll" | "damage" | "healing"} type 
     * @returns {[{ label: string, value: any} ]}
     */
    #extractModifiers(type, { rollData } = {}) {
        const bonusEffects = type === 'roll' ? this.bonusEffects : this.damageEffects;
        const path = `system.bonuses.${type}`;
        const modifiers = [];

        // Add some roll only modifiers
        if (type === 'roll') {
            if (this.roll?.trait && rollData.traits?.[this.roll.trait]) {
                modifiers.push({
                    label: _loc(
                        this.roll.type === CONFIG.DH.GENERAL.rollTypes.spellcast.id
                            ? 'DAGGERHEART.CONFIG.RollTypes.spellcast.name'
                            : `DAGGERHEART.CONFIG.Traits.${this.roll.trait}.name`),
                    value: rollData.traits[this.roll.trait].value
                });
            }
        }

        // Add from effects
        for (const effect of Object.values(bonusEffects)) {
            if (!effect.selected) continue;
            for (const change of effect.changes) {
                if (!change.key?.includes(path)) continue;
                
                // TODO: We should handle override and all other modes. It'll have to be done in a different way
                // as we cannot just go through each change and sum them up. We'll have to get the total value with
                // overrides and everything considered.
                if (!['add', 'subtract'].includes(change.type)) continue;

                const changeValue = game.system.api.documents.DhActiveEffect.getChangeValue(
                    rollData ?? this.getRollData(),
                    change,
                    effect.origEffect
                );
                const typedValue = change.type === 'add' ? changeValue : (Number.isNumeric(changeValue) ? -changeValue : `-1 * (${changeValue})`);
                modifiers.push({ label: effect.name, value: typedValue });
            }
        }

        return modifiers;
    }

    #mergeBonusEffects(effects, newEffects) {
        if (effects) {
            const newKeys = Object.keys(newEffects);
            for (const key of newKeys) {
                effects[key] = foundry.utils.mergeObject(
                    effects[key] ?? {}, 
                    { ...newEffects[key], selected: effects[key]?.selected ?? newEffects[key]?.selected },
                    { recursive: false }
                );
            }
            for (const oldKey of Object.keys(effects).filter(k => !newKeys.includes(k))) {
                delete effects[oldKey];
            }
            return effects;
        } else {
            return newEffects;
        }
    }
}
