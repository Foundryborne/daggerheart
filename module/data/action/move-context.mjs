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
        
        // Redirect to the partner if companion. Ideally we shouldn't do this and keep it on the partner,
        // but the system as a whole expects the partner to be the main roll.
        // todo: make it work somehow in the dice
        const partner = this.actor?.system?.partner;
        if (partner) {
            this.companion = this.actor;
            this.actor = partner;
        }

        this.message = data.message;
        this.event ??= data.event;

        // Passthrough certain props. This allows RollConfigs to be recreated
        this.title = data.title ?? _loc(action?.name);
        this.headerTitle = data.headerTitle;
        this.actionType = data.actionType ?? action?.actionType ?? 'action';
        this.fateType = data.fateType;

        this.selectedMessageMode = data.selectedMessageMode ?? game.settings.get('core', 'messageMode');
        this.tierLimit = data.tierLimit;
        this.modifications = data.modifications;
        this.costs = data.costs ?? [];
        this.targets = data.targets ?? [];
        this.countdowns = data.countdowns;
        /** The list of selected experiences */
        this.experiences = data.experiences ?? [];
        this.skips = foundry.utils.mergeObject({
            resources: false,
            triggers: false,
            createMessage: false,
            updateCountdowns: false,
            reaction: false
        }, data.skips ?? {});
        this.damageOptions = data.damageOptions ?? {};
        /** If set, skips creation of dedicated toChat messages. Used to prevent duplicates. */
        this.actionChatMessageHandled = Boolean(data.actionChatMessageHandled ?? false);
        
        // Initialize props based on the documents and action
        this.hasSave = Boolean(action?.hasSave);
        this.hasDamage = Boolean(action?.hasDamage);
        this.hasEffect = Boolean(action?.hasEffect);
        this.hasTarget = data.hasTarget ?? Boolean(action?.hasTarget); // targetField sets it to true, even though the action has it to false
        this.hasHealing = Boolean(action?.hasHealing);
        this.onSave = action?.save?.damageMod;
        this.isDirect = false;
        this.targetUuid = action?.targetUuid;
        this.rollType = data.rollType ?? null;
        /** Evaluated main roll @type {InstanceType<typeof game.system.api.dice.DHRoll>} */
        this.evaluated = data.evaluated ?? null;
        this.evaluate = action ? this.hasRoll : null; // todo: determine use and see if action filter is required

        // Set the roll has hasRoll. If roll is explicitly set to null, or hasRoll explicitly set to false, keep as null
        this.roll = data.roll ?? 
            (data.hasRoll === false || !action?.hasRoll || this.roll === null ? null : action?.roll ?? {});
        this.hasRoll = Boolean(this.roll);
        
        this.damage = data.damage;
        
        this.resourceUpdates = new ResourceUpdateMap(this.actor);
        this.dialog = {}; // updated when keybindings are applied

        const damage = action?.damage;
        if (actor && damage) {
            this.isDirect = damage.main?.direct;
            const groupAttackTokens = damage.main?.groupAttack
                ? game.system.api.fields.ActionFields.DamageField.getGroupAttackTokens(
                    this.actor.id,
                    this.damage.main.groupAttack
                )
                : null;
            this.damageOptions.groupAttack ??= damage.main?.groupAttack
                ? {
                    numAttackers: Math.max(groupAttackTokens.length, 1),
                    range: this.damage.main.groupAttack
                }
                : null;
        }

        this.source = {
            actor: actor?.uuid,
            item: item?.id,
            action: action?.id,
            originItem: action?.originItem
        };
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
        return CONFIG.Dice.daggerheart[this.rollType] ?? CONFIG.Dice.daggerheart['DHRoll'];
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

    async initialize() {
        this.rollType = this.roll?.lite
            ? 'DHRoll'
            : this.fateType
                ? 'FateRoll'
                : this.actor?.rollClass?.name ?? (this.roll?.type === 'trait' ? 'DualityRoll' : 'DHRoll');

        this.effects = await this.getActionRelevantEffects();

        this.guaranteedCritical = this.actor?.appliedEffects.reduce((a, c) => {
            const change = c.system.changes.find(ch => ch.key === 'system.rules.roll.guaranteedCritical');
            if (change) a = true;
            return a;
        }, false);
        if (this.guaranteedCritical) {
            this.dialog.configure = false;
        }

        if (this.costs && (this.action || this.actor)) {
            const CostField = game.system.api.fields.ActionFields.CostField;
            this.costs = CostField.calcCosts.call(this.action ?? { actor: this.actor }, this.costs);
        }

        if (this.uses) {
            this.uses.value ??= 0;
            this.uses.remaining = this.action?.remainingUses;
            this.uses.enabled ??= true;
        }

        this.applyKeybindings();
    }

    /** 
     * Apply the results of an event's options to data
     * This occurs during the initialize phase
     */
    applyKeybindings(event = this.event) {
        // Apply configure prop, but only if not set to allow overrides
        // todo: should this be a thing in skips?
        this.dialog.configure ??= !event || !(event.shiftKey || event.altKey || event.ctrlKey)

        const keys = {
            normal: event && (event.shiftKey || event.altKey || event.ctrlKey),
            advantage: Boolean(event?.altKey),
            disadvantage: Boolean(event?.ctrlKey)
        };

        // Determine advantage mode
        if (this.roll) {
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
     * Get all potentially applicable effects on the actor for the action's RollDialog
     * @returns {Promise<DhActiveEffect[]>}
     */
    async getActionRelevantEffects() {
        if (!this.actor) return [];

        const rollData = this.getRollData();
        const applicableEffects = this.actor.allApplicableEffects({ noTransferArmor: true, noSelfArmor: true });
        return [...applicableEffects].filter(e => !e.isSuppressed).reduce((acc, effect) => {
            const conditionalPassed = effect.system.testConditionals(rollData, { 
                phase: CONFIG.DH.EFFECTS.conditionalPhases.roll.id 
            });
            if (conditionalPassed)
                acc.push(effect);

            return acc;
        }, []);
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
    async spendResources({ successCost = false } = {}) {
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

        const item = this.item;
        if (item) {
            for (var cost of this.costs) {
                if (cost.itemId) {
                    usefulResources[cost.key] = {
                        value: cost.value,
                        target: this.parent.parent,
                        itemId: cost.itemId
                    };
                }
            }
        }

        const isSuccess = this.roll?.success; // is this the right property?
        const resources = CostField.getRealCosts(this.costs)
            .filter(
                c =>
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
            ((!successCost && (!this.uses?.consumeOnSuccess || isSuccess)) ||
                (successCost && this.uses?.consumeOnSuccess))
        ) {
            await this.action.update({ 'uses.value': this.action.uses.value + 1 });
        }
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
}

