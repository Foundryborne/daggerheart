import { DHActionDiceData, DHActionRollData, DHDamageField } from './actionDice.mjs';
import DhpActor from '../../documents/actor.mjs';
import D20RollDialog from '../../applications/dialogs/d20RollDialog.mjs';

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

export default class DHBaseAction extends foundry.abstract.DataModel {
    static extraSchemas = [];

    static defineSchema() {
        return {
            _id: new fields.DocumentIdField(),
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
            }),
            cost: new fields.ArrayField(
                new fields.SchemaField({
                    key: new fields.StringField({
                        nullable: false,
                        required: true,
                        initial: 'hope'
                    }),
                    keyIsID: new fields.BooleanField(),
                    value: new fields.NumberField({ nullable: true, initial: 1 }),
                    scalable: new fields.BooleanField({ initial: false }),
                    step: new fields.NumberField({ nullable: true, initial: null })
                })
            ),
            uses: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                max: new fields.NumberField({ nullable: true, initial: null }),
                recovery: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.refreshTypes,
                    initial: null,
                    nullable: true
                })
            }),
            range: new fields.StringField({
                choices: CONFIG.DH.GENERAL.range,
                required: false,
                blank: true
                // initial: null
            }),
            ...this.defineExtraSchema()
        };
    }

    static defineExtraSchema() {
        const extraFields = {
                damage: new DHDamageField(),
                roll: new fields.EmbeddedDataField(DHActionRollData),
                save: new fields.SchemaField({
                    trait: new fields.StringField({
                        nullable: true,
                        initial: null,
                        choices: CONFIG.DH.ACTOR.abilities
                    }),
                    difficulty: new fields.NumberField({ nullable: true, initial: 10, integer: true, min: 0 }),
                    damageMod: new fields.StringField({
                        initial: CONFIG.DH.ACTIONS.damageOnSave.none.id,
                        choices: CONFIG.DH.ACTIONS.damageOnSave
                    })
                }),
                target: new fields.SchemaField({
                    type: new fields.StringField({
                        choices: CONFIG.DH.ACTIONS.targetTypes,
                        initial: CONFIG.DH.ACTIONS.targetTypes.any.id,
                        nullable: true,
                        initial: null
                    }),
                    amount: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
                }),
                effects: new fields.ArrayField( // ActiveEffect
                    new fields.SchemaField({
                        _id: new fields.DocumentIdField(),
                        onSave: new fields.BooleanField({ initial: false })
                    })
                ),
                healing: new fields.SchemaField({
                    type: new fields.StringField({
                        choices: CONFIG.DH.GENERAL.healingTypes,
                        required: true,
                        blank: false,
                        initial: CONFIG.DH.GENERAL.healingTypes.hitPoints.id,
                        label: 'Healing'
                    }),
                    resultBased: new fields.BooleanField({
                        initial: false,
                        label: 'DAGGERHEART.ACTIONS.Settings.resultBased.label'
                    }),
                    value: new fields.EmbeddedDataField(DHActionDiceData),
                    valueAlt: new fields.EmbeddedDataField(DHActionDiceData)
                }),
                beastform: new fields.SchemaField({
                    tierAccess: new fields.SchemaField({
                        exact: new fields.NumberField({ integer: true, nullable: true, initial: null })
                    })
                })
            },
            extraSchemas = {};

        this.extraSchemas.forEach(s => (extraSchemas[s] = extraFields[s]));
        return extraSchemas;
    }

    prepareData() {}

    get index() {
        return foundry.utils.getProperty(this.parent, this.systemPath).indexOf(this);
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
        return 'ability';
    }

    static getSourceConfig(parent) {
        const updateSource = {};
        updateSource.img ??= parent?.img ?? parent?.system?.img;
        if (parent?.type === 'weapon') {
            updateSource['damage'] = { includeBase: true };
            updateSource['range'] = parent?.system?.attack?.range;
            updateSource['roll'] = {
                useDefault: true
            };
        } else {
            if (parent?.system?.trait) {
                updateSource['roll'] = {
                    type: this.getRollType(parent),
                    trait: parent.system.trait
                };
            }
            if (parent?.system?.range) {
                updateSource['range'] = parent?.system?.range;
            }
        }
        return updateSource;
    }

    getRollData(data = {}) {
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
        const isFastForward = event.shiftKey || (!this.hasRoll && !this.hasSave);
        // Prepare base Config
        const initConfig = this.initActionConfig(event);

        // Prepare Targets
        const targetConfig = this.prepareTarget();
        if (isFastForward && !targetConfig) return ui.notifications.warn('Too many targets selected for that actions.');

        // Prepare Range
        const rangeConfig = this.prepareRange();

        // Prepare Costs
        const costsConfig = this.prepareCost();
        if (isFastForward && !(await this.hasCost(costsConfig)))
            return ui.notifications.warn("You don't have the resources to use that action.");

        // Prepare Uses
        const usesConfig = this.prepareUse();
        if (isFastForward && !this.hasUses(usesConfig))
            return ui.notifications.warn("That action doesn't have remaining uses.");

        // Prepare Roll Data
        const actorData = this.getRollData();

        let config = {
            ...initConfig,
            targets: targetConfig,
            range: rangeConfig,
            costs: costsConfig,
            uses: usesConfig,
            data: actorData
        };

        if (Hooks.call(`${CONFIG.DH.id}.preUseAction`, this, config) === false) return;

        // Display configuration window if necessary
        // if (config.dialog?.configure && this.requireConfigurationDialog(config)) {
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
    initActionConfig(event) {
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
            hasSave: this.hasSave
        };
    }

    requireConfigurationDialog(config) {
        return !config.event.shiftKey && !this.hasRoll && (config.costs?.length || config.uses);
    }

    prepareCost() {
        const costs = this.cost?.length ? foundry.utils.deepClone(this.cost) : [];
        return this.calcCosts(costs);
    }

    prepareUse() {
        const uses = this.uses?.max ? foundry.utils.deepClone(this.uses) : null;
        if (uses && !uses.value) uses.value = 0;
        return uses;
    }

    prepareTarget() {
        if (!this.target?.type) return [];
        let targets;
        if (this.target?.type === CONFIG.DH.ACTIONS.targetTypes.self.id)
            targets = this.constructor.formatTarget(this.actor.token ?? this.actor.prototypeToken);
        targets = Array.from(game.user.targets);
        if (this.target.type !== CONFIG.DH.ACTIONS.targetTypes.any.id) {
            targets = targets.filter(t => this.isTargetFriendly(t));
            if (this.target.amount && targets.length > this.target.amount) targets = [];
        }
        targets = targets.map(t => this.constructor.formatTarget(t));
        return targets;
    }

    prepareRange() {
        const range = this.range ?? null;
        return range;
    }

    prepareRoll() {
        const roll = {
            modifiers: [],
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
    /* ROLL */

    /* SAVE */
    get hasSave() {
        return !!this.save?.trait;
    }
    /* SAVE */

    /* COST */

    getRealCosts(costs) {
        const realCosts = costs?.length ? costs.filter(c => c.enabled) : [];
        return realCosts;
    }

    calcCosts(costs) {
        return costs.map(c => {
            c.scale = c.scale ?? 1;
            c.step = c.step ?? 1;
            c.total = c.value * c.scale * c.step;
            c.enabled = c.hasOwnProperty('enabled') ? c.enabled : true;
            return c;
        });
    }

    async getResources(costs) {
        const actorResources = this.actor.system.resources;
        const itemResources = {};
        for (var itemResource of costs) {
            if (itemResource.keyIsID) {
                itemResources[itemResource.key] = {
                    value: this.parent.resource.value ?? 0
                };
            }
        }

        return {
            ...actorResources,
            ...itemResources
        };
    }

    /* COST */
    async hasCost(costs) {
        const realCosts = this.getRealCosts(costs),
            hasFearCost = realCosts.findIndex(c => c.key === 'fear');
        if (hasFearCost > -1) {
            const fearCost = realCosts.splice(hasFearCost, 1)[0];
            if (
                !game.user.isGM ||
                fearCost.total > game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear)
            )
                return false;
        }

        /* isReversed is a sign that the resource is inverted, IE it counts upwards instead of down */
        const resources = await this.getResources(realCosts);
        return realCosts.reduce(
            (a, c) =>
                a && resources[c.key].isReversed
                    ? resources[c.key].value + (c.total ?? c.value) <= resources[c.key].max
                    : resources[c.key]?.value >= (c.total ?? c.value),
            true
        );
    }

    /* USES */
    calcUses(uses) {
        if (!uses) return null;
        return {
            ...uses,
            enabled: uses.hasOwnProperty('enabled') ? uses.enabled : true
        };
    }

    hasUses(uses) {
        if (!uses) return true;
        return (uses.hasOwnProperty('enabled') && !uses.enabled) || uses.value + 1 <= uses.max;
    }

    /* TARGET */
    isTargetFriendly(target) {
        const actorDisposition = this.actor.token
                ? this.actor.token.disposition
                : this.actor.prototypeToken.disposition,
            targetDisposition = target.document.disposition;
        return (
            (this.target.type === CONFIG.DH.ACTIONS.targetTypes.friendly.id &&
                actorDisposition === targetDisposition) ||
            (this.target.type === CONFIG.DH.ACTIONS.targetTypes.hostile.id &&
                actorDisposition + targetDisposition === 0)
        );
    }

    static formatTarget(actor) {
        return {
            id: actor.id,
            actorId: actor.actor.uuid,
            name: actor.actor.name,
            img: actor.actor.img,
            difficulty: actor.actor.system.difficulty,
            evasion: actor.actor.system.evasion
        };
    }
    /* TARGET */

    /* RANGE */

    /* RANGE */

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

    async toChat(origin) {
        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.CONFIG.ActionType.action'),
            origin: origin,
            img: this.img,
            name: this.name,
            description: this.description,
            actions: []
        };
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            )
        });

        cls.create(msg.toObject());
    }
}
