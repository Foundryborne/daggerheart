import { ResourceUpdateMap } from '../data/actor/resource-update-map.mjs';
import D20Roll from './d20Roll.mjs';

/** @import DHBaseAction from '../data/action/baseAction.mjs'; */

export class RollConfig {
    /**
     * 
     * @param {object} data RollConfig data or creation data for one 
     * @param {object} options  Resolved document types for overrides. 
     *                          Mostly used to pass the event without mutation or in build() after parsing the source data. 
     * @param {Event} [options.event]
     * @param {DhActor} [options.actor]
     * @param {DhItem} [options.item]
     */
    constructor(data = {}, { actor, item, action, event } = {}) {
        // Store documents and resolve missing ones
        this.actor = actor ??= data.actor ?? data.action?.actor ?? data.item?.actor;
        this.item = item ??= data.item ?? data.action?.item;
        this.action = action ??= data.action;
        this.event ??= data.event;
        const damage = action?.damage;

        // Passthrough certain props. This allows RollConfigs to be recreated
        this.selectedMessageMode = data.selectedMessageMode ?? game.settings.get('core', 'messageMode');
        this.tierLimit = data.tierLimit;
        this.modifications = data.modifications;
        this.costs = data.costs ?? [];
        this.countdowns = data.countdowns;
        this.skips = foundry.utils.mergeObject({
            resources: false,
            triggers: false,
            createMessage: false,
            updateCountdowns: false,
            reaction: false
        }, data.skips ?? {});
        this.damageOptions = data.damageOptions ?? {};
        
        // Initialize props based on the documents and action
        this.title = data.title ?? _loc(action?.name);
        this.headerTitle = data.headerTitle;
        this.actionType = data.actionType ?? action?.actionType ?? 'action';
        this.onSave = action?.save.damageMod;
        this.hasDamage = Boolean(action?.hasDamage);
        this.hasEffect = Boolean(action?.hasEffect);
        this.hasRoll = Boolean(action?.hasRoll || data.roll);
        this.hasHealing = Boolean(action?.hasHealing);
        this.isDirect = false;
        this.targetUuid = action?.targetUuid;
        this.roll = data.roll ?? {};
        this.evaluate = action ? this.hasRoll : null; // todo: determine use and see if action filter is required
        
        this.resourceUpdates = new ResourceUpdateMap(this.actor);
        this.dialog = {}; // updated when keybindings are applied

        // Create roll data. This should probably not be done here, but the codebase expects if
        // TODO: Convert it to config.getRollData() that must be called explicitly
        this.data = action?.getRollData() ?? item?.getRollData() ?? actor?.getRollData() ?? {};
        this.data.experiences ??= {};
        this.data.traits ??= {};
        this.data.rules ??= {};
        this.data.action ??= {
            actionType: this.actionType, 
            roll: this.roll
        };

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

    get rollClass() {
        return this.roll.lite ? CONFIG.Dice.daggerheart['DHRoll'] : this.actor?.rollClass;
    }

    async initialize() {
        this.effects = await this.getActionRelevantEffects();

        this.guaranteedCritical = this.data?.parent?.appliedEffects.reduce((a, c) => {
            const change = c.system.changes.find(ch => ch.key === 'system.rules.roll.guaranteedCritical');
            if (change) a = true;
            return a;
        }, false);
        if (this.guaranteedCritical) {
            this.dialog.configure = false;
        }

        this.applyKeybindings();

        // todo: determine if "configure" should occur here or be a separate step.
        // "configure" is the show roll dialog step, handled by buildConfigure().
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
        const advantage = this.roll.advantage === D20Roll.ADV_MODE.ADVANTAGE || keys.advantage || this.advantage;
        const disadvantage =
            this.roll.advantage === D20Roll.ADV_MODE.DISADVANTAGE || keys.disadvantage || this.disadvantage;
        this.roll.advantage = advantage && !disadvantage
            ? D20Roll.ADV_MODE.ADVANTAGE :
            !advantage && disadvantage
                ? D20Roll.ADV_MODE.DISADVANTAGE
                : D20Roll.ADV_MODE.NORMAL;
    }

    /**
     * Get all potentially applicable effects on the actor for the action's RollDialog
     * @returns {Promise<DhActiveEffect[]>}
     */
    async getActionRelevantEffects() {
        if (!this.actor) return [];

        const applicableEffects = this.actor.allApplicableEffects({ noTransferArmor: true, noSelfArmor: true });
        return [...applicableEffects].filter(e => !e.isSuppressed).reduce((acc, effect) => {
            const conditionalPassed = effect.system.testConditionals(this.data, { 
                phase: CONFIG.DH.EFFECTS.conditionalPhases.roll.id 
            });
            if (conditionalPassed)
                acc.push(effect);

            return acc;
        }, []);
    }

    static async build(data, options = {}) {
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
}

