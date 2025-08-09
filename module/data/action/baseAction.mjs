import DhpActor from '../../documents/actor.mjs';
import D20RollDialog from '../../applications/dialogs/d20RollDialog.mjs';
import { ActionMixin } from '../fields/actionField.mjs';
import { abilities } from '../../config/actorConfig.mjs';

const fields = foundry.data.fields;

/*
    !!! I'm currently refactoring the whole Action thing, it's a WIP !!!
*/

/*
    ToDo
    - Target Check / Target Picker
    - Range Check
    - Area of effect and measurement placement
    - Summon Action create method
*/

export default class DHBaseAction extends ActionMixin(foundry.abstract.DataModel) {
    static extraSchemas = ['cost', 'uses', 'range'];

    static defineSchema() {
        const schemaFields = {
            _id: new fields.DocumentIdField({ initial: () => foundry.utils.randomID() }),
            systemPath: new fields.StringField({ required: true, initial: 'actions' }),
            type: new fields.StringField({ initial: undefined, readonly: true, required: true }),
            name: new fields.StringField({ initial: undefined }),
            description: new fields.HTMLField(),
            img: new fields.FilePathField({ initial: undefined, categories: ['IMAGE'], base64: false }),
            chatDisplay: new fields.BooleanField({ initial: true, label: 'DAGGERHEART.ACTIONS.Config.displayInChat' }),
            actionType: new fields.StringField({
                choices: CONFIG.DH.ITEM.actionTypes,
                initial: 'action',
                nullable: true
            })
        };

        this.extraSchemas.forEach(s => {
            let clsField;
            if ((clsField = this.getActionField(s))) schemaFields[s] = new clsField();
        });

        return schemaFields;
    }

    static getActionField(name) {
        const field = game.system.api.fields.ActionFields[`${name.capitalize()}Field`];
        return fields.DataField.isPrototypeOf(field) && field;
    }

    prepareData() {
        this.name = this.name || game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[this.type].name);
        this.img = this.img ?? this.parent?.parent?.img;
    }

    get id() {
        return this._id;
    }

    get item() {
        return this.parent.parent;
    }

    get actor() {
        return this.item instanceof DhpActor
            ? this.item
            : this.item?.parent instanceof DhpActor
              ? this.item.parent
              : this.item?.actor;
    }

    static getRollType(parent) {
        return 'trait';
    }

    static getSourceConfig(parent) {
        const updateSource = {};
        if (parent?.parent?.type === 'weapon' && this === game.system.api.models.actions.actionsTypes.attack) {
            updateSource['damage'] = { includeBase: true };
            updateSource['range'] = parent?.attack?.range;
            updateSource['roll'] = {
                useDefault: true
            };
        } else {
            if (parent?.trait) {
                updateSource['roll'] = {
                    type: this.getRollType(parent),
                    trait: parent.trait
                };
            }
            if (parent?.range) {
                updateSource['range'] = parent?.range;
            }
        }
        return updateSource;
    }

    getRollData(data = {}) {
        if (!this.actor) return null;
        const actorData = this.actor.getRollData(false);

        // Add Roll results to RollDatas
        actorData.result = data.roll?.total ?? 1;

        actorData.scale = data.costs?.length // Right now only return the first scalable cost.
            ? (data.costs.find(c => c.scalable)?.total ?? 1)
            : 1;
        actorData.roll = {};

        return actorData;
    }

    async use(event, options = {}) {
        if (!this.actor) throw new Error("An Action can't be used outside of an Actor context.");

        if (this.chatDisplay) await this.toChat();
        let { byPassRoll } = options,
            config = this.prepareConfig(event, byPassRoll);
        for (let i = 0; i < this.constructor.extraSchemas.length; i++) {
            let clsField = this.constructor.getActionField(this.constructor.extraSchemas[i]);
            if (clsField?.prepareConfig) {
                const keep = clsField.prepareConfig.call(this, config);
                if (config.isFastForward && !keep) return;
            }
        }

        if (Hooks.call(`${CONFIG.DH.id}.preUseAction`, this, config) === false) return;

        // Display configuration window if necessary
        if (this.requireConfigurationDialog(config)) {
            config = await D20RollDialog.configure(null, config);
            if (!config) return;
        }

        if (config.hasRoll) {
            const rollConfig = this.prepareRoll(config);
            config.roll = rollConfig;
            config = await this.actor.diceRoll(config);
            if (!config) return;
        }

        if (this.doFollowUp(config)) {
            if (this.rollDamage && this.damage.parts.length) await this.rollDamage(event, config);
            else if (this.trigger) await this.trigger(event, config);
            else if (this.hasSave || this.hasEffect) {
                const roll = new CONFIG.Dice.daggerheart.DHRoll('');
                roll._evaluated = true;
                await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
            }
        }

        // Consume resources
        await this.consume(config);

        if (Hooks.call(`${CONFIG.DH.id}.postUseAction`, this, config) === false) return;

        return config;
    }

    /* */
    prepareConfig(event, byPass = false) {
        const hasRoll = this.getUseHasRoll(byPass);
        return {
            event,
            title: `${this.item.name}: ${this.name}`,
            source: {
                item: this.item._id,
                action: this._id,
                actor: this.actor.uuid
            },
            dialog: {
                configure: hasRoll
            },
            type: this.type,
            hasRoll: hasRoll,
            hasDamage: this.damage?.parts?.length && this.type !== 'healing',
            hasHealing: this.damage?.parts?.length && this.type === 'healing',
            hasEffect: !!this.effects?.length,
            hasSave: this.hasSave,
            selectedRollMode: game.settings.get('core', 'rollMode'),
            isFastForward: event.shiftKey,
            data: this.getRollData(),
            evaluate: hasRoll
        };
    }

    requireConfigurationDialog(config) {
        return !config.event.shiftKey && !config.hasRoll && (config.costs?.length || config.uses);
    }

    prepareRoll() {
        const roll = {
            baseModifiers: this.roll.getModifier(),
            label: 'Attack',
            type: this.actionType,
            difficulty: this.roll?.difficulty,
            formula: this.roll.getFormula(),
            advantage: CONFIG.DH.ACTIONS.advantageState[this.roll.advState].value
        };
        if (this.roll?.type === 'diceSet' || !this.hasRoll) roll.lite = true;

        return roll;
    }

    doFollowUp(config) {
        return !config.hasRoll;
    }

    async consume(config, successCost = false) {
        const usefulResources = foundry.utils.deepClone(this.actor.system.resources);

        for (var cost of config.costs) {
            if (cost.keyIsID) {
                usefulResources[cost.key] = {
                    value: cost.value,
                    target: this.parent.parent,
                    keyIsID: true
                };
            }
        }

        const resources = game.system.api.fields.ActionFields.CostField.getRealCosts(config.costs)
            .filter(
                c =>
                    (!successCost && (!c.consumeOnSuccess || config.roll?.success)) ||
                    (successCost && c.consumeOnSuccess)
            )
            .reduce((a, c) => {
                const resource = usefulResources[c.key];
                if (resource) {
                    a.push({
                        key: c.key,
                        value: (c.total ?? c.value) * (resource.isReversed ? 1 : -1),
                        target: resource.target,
                        keyIsID: resource.keyIsID
                    });
                    return a;
                }
            }, []);

        await (this.actor.system.partner ?? this.actor).modifyResource(resources);
        if (
            config.uses?.enabled &&
            ((!successCost && (!config.uses?.consumeOnSuccess || config.roll?.success)) ||
                (successCost && config.uses?.consumeOnSuccess))
        )
            this.update({ 'uses.value': this.uses.value + 1 });

        if (config.roll?.success || successCost) {
            setTimeout(() => {
                (config.message ?? config.parent).update({ 'system.successConsumed': true });
            }, 50);
        }
    }
    /* */

    /* ROLL */
    getUseHasRoll(byPass = false) {
        return this.hasRoll && !byPass;
    }

    get hasRoll() {
        return !!this.roll?.type;
    }

    get modifiers() {
        if (!this.actor) return [];
        const modifiers = [];
        /** Placeholder for specific bonuses **/
        return modifiers;
    }
    /* ROLL */

    /* SAVE */
    get hasSave() {
        return !!this.save?.trait;
    }
    /* SAVE */

    /* EFFECTS */
    get hasEffect() {
        return this.effects?.length > 0;
    }

    async applyEffects(event, data, targets) {
        targets ??= data.system.targets;
        const force = true; /* Where should this come from? */
        if (!this.effects?.length || !targets.length) return;
        let effects = this.effects;
        targets.forEach(async token => {
            if (!token.hit && !force) return;
            if (this.hasSave && token.saved.success === true) {
                effects = this.effects.filter(e => e.onSave === true);
            }
            if (!effects.length) return;
            effects.forEach(async e => {
                const actor = canvas.tokens.get(token.id)?.actor,
                    effect = this.item.effects.get(e._id);
                if (!actor || !effect) return;
                await this.applyEffect(effect, actor);
            });
        });
    }

    async applyEffect(effect, actor) {
        const existingEffect = actor.effects.find(e => e.origin === effect.uuid);
        if (existingEffect) {
            return effect.update(
                foundry.utils.mergeObject({
                    ...effect.constructor.getInitialDuration(),
                    disabled: false
                })
            );
        }

        // Otherwise, create a new effect on the target
        const effectData = foundry.utils.mergeObject({
            ...effect.toObject(),
            disabled: false,
            transfer: false,
            origin: effect.uuid
        });
        await ActiveEffect.implementation.create(effectData, { parent: actor });
    }
    /* EFFECTS */

    /* SAVE */
    async rollSave(actor, event, message) {
        if (!actor) return;
        const title = actor.isNPC
            ? game.i18n.localize('DAGGERHEART.GENERAL.reactionRoll')
            : game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                  ability: game.i18n.localize(abilities[this.save.trait]?.label)
              });
        return actor.diceRoll({
            event,
            title,
            roll: {
                trait: this.save.trait,
                difficulty: this.save.difficulty ?? this.actor?.baseSaveDifficulty,
                type: 'reaction'
            },
            type: 'trait',
            hasRoll: true,
            data: actor.getRollData()
        });
    }

    updateSaveMessage(result, message, targetId) {
        if (!result) return;
        const updateMsg = this.updateChatMessage.bind(this, message, targetId, {
            result: result.roll.total,
            success: result.roll.success
        });
        if (game.modules.get('dice-so-nice')?.active)
            game.dice3d.waitFor3DAnimationByMessageID(result.message.id ?? result.message._id).then(() => updateMsg());
        else updateMsg();
    }

    static rollSaveQuery({ actionId, actorId, event, message }) {
        return new Promise(async (resolve, reject) => {
            const actor = await fromUuid(actorId),
                action = await fromUuid(actionId);
            if (!actor || !actor?.isOwner) reject();
            action.rollSave(actor, event, message).then(result => resolve(result));
        });
    }
    /* SAVE */

    async updateChatMessage(message, targetId, changes, chain = true) {
        setTimeout(async () => {
            const chatMessage = ui.chat.collection.get(message._id);

            await chatMessage.update({
                flags: {
                    [game.system.id]: {
                        reactionRolls: {
                            [targetId]: changes
                        }
                    }
                }
            });
        }, 100);
        if (chain) {
            if (message.system.source.message)
                this.updateChatMessage(ui.chat.collection.get(message.system.source.message), targetId, changes, false);
            const relatedChatMessages = ui.chat.collection.filter(c => c.system.source?.message === message._id);
            relatedChatMessages.forEach(c => {
                this.updateChatMessage(c, targetId, changes, false);
            });
        }
    }

    /**
     * Generates a list of localized tags for this action.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [
            game.i18n.localize(`DAGGERHEART.ACTIONS.TYPES.${this.type}.name`),
            game.i18n.localize(`DAGGERHEART.CONFIG.ActionType.${this.actionType}`)
        ];

        return tags;
    }
}
