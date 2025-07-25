import DhpActor from '../../documents/actor.mjs';
import D20RollDialog from '../../applications/dialogs/d20RollDialog.mjs';
import { ActionMixin } from '../fields/actionField.mjs';

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
            chatDisplay: new fields.BooleanField({ initial: true, label: 'Display in chat' }),
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

    get chatTemplate() {
        return 'systems/daggerheart/templates/ui/chat/duality-roll.hbs';
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

    async use(event, ...args) {
        if (!this.actor) throw new Error("An Action can't be used outside of an Actor context.");

        if (this.chatDisplay) this.toChat();

        let config = this.prepareConfig(event);
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

        if (this.hasRoll) {
            const rollConfig = this.prepareRoll(config);
            config.roll = rollConfig;
            config = await this.actor.diceRoll(config);
            if (!config) return;
        }

        if (this.doFollowUp()) {
            if (this.rollDamage) await this.rollDamage(event, config);
            if (this.rollHealing) await this.rollHealing(event, config);
            if (this.trigger) await this.trigger(event, config);
        }

        // Consume resources
        await this.consume(config);

        if (Hooks.call(`${CONFIG.DH.id}.postUseAction`, this, config) === false) return;

        return config;
    }

    /* */
    prepareConfig(event) {
        return {
            event,
            title: this.item.name,
            source: {
                item: this.item._id,
                action: this._id
            },
            dialog: {},
            type: this.type,
            hasDamage: !!this.damage?.parts?.length,
            hasHealing: !!this.healing,
            hasEffect: !!this.effects?.length,
            hasSave: this.hasSave,
            selectedRollMode: game.settings.get('core', 'rollMode'),
            isFastForward: event.shiftKey,
            data: this.getRollData()
        };
    }

    requireConfigurationDialog(config) {
        return !config.event.shiftKey && !this.hasRoll && (config.costs?.length || config.uses);
    }

    prepareRoll() {
        const roll = {
            modifiers: this.modifiers,
            trait: this.roll?.trait,
            label: 'Attack',
            type: this.actionType,
            difficulty: this.roll?.difficulty,
            formula: this.roll.getFormula(),
            bonus: this.roll.bonus,
            advantage: CONFIG.DH.ACTIONS.advandtageState[this.roll.advState].value
        };
        if (this.roll?.type === 'diceSet') roll.lite = true;

        return roll;
    }

    doFollowUp(config) {
        return !this.hasRoll;
    }

    async consume(config) {
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
        const resources = config.costs
            .filter(c => c.enabled !== false)
            .map(c => {
                const resource = usefulResources[c.key];
                return {
                    key: c.key,
                    value: (c.total ?? c.value) * (resource.isReversed ? 1 : -1),
                    target: resource.target,
                    keyIsID: resource.keyIsID
                };
            });

        await this.actor.modifyResource(resources);
        if (config.uses?.enabled) {
            const newActions = foundry.utils.getProperty(this.item.system, this.systemPath).map(x => x.toObject());
            newActions[this.index].uses.value++;
            await this.item.update({ [`system.${this.systemPath}`]: newActions });
        }
    }
    /* */

    /* ROLL */
    get hasRoll() {
        return !!this.roll?.type || !!this.roll?.bonus;
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
    async applyEffects(event, data, targets) {
        targets ??= data.system.targets;
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
        // Enable an existing effect on the target if it originated from this effect
        const existingEffect = actor.effects.find(e => e.origin === origin.uuid);
        if (existingEffect) {
            return existingEffect.update(
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
            origin: origin.uuid
        });
        await ActiveEffect.implementation.create(effectData, { parent: actor });
    }
    /* EFFECTS */

    /* SAVE */
    async rollSave(target, event, message) {
        if (!target?.actor) return;
        return target.actor
            .diceRoll({
                event,
                title: 'Roll Save',
                roll: {
                    trait: this.save.trait,
                    difficulty: this.save.difficulty,
                    type: 'reaction'
                },
                data: target.actor.getRollData()
            })
            .then(async result => {
                if (result)
                    this.updateChatMessage(message, target.id, {
                        result: result.roll.total,
                        success: result.roll.success
                    });
            });
    }
    /* SAVE */

    async updateChatMessage(message, targetId, changes, chain = true) {
        setTimeout(async () => {
            const chatMessage = ui.chat.collection.get(message._id),
                msgTargets = chatMessage.system.targets,
                msgTarget = msgTargets.find(mt => mt.id === targetId);
            msgTarget.saved = changes;
            await chatMessage.update({ 'system.targets': msgTargets });
        }, 100);
        if (chain) {
            if (message.system.source.message)
                this.updateChatMessage(ui.chat.collection.get(message.system.source.message), targetId, changes, false);
            const relatedChatMessages = ui.chat.collection.filter(c => c.system.source.message === message._id);
            relatedChatMessages.forEach(c => {
                this.updateChatMessage(c, targetId, changes, false);
            });
        }
    }
}
