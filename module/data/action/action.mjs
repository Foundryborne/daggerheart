import CostSelectionDialog from '../../applications/costSelectionDialog.mjs';
import { DHActionDiceData, DHDamageData, DHDamageField } from './actionDice.mjs';
import DhpActor from '../../documents/actor.mjs';
import D20RollDialog from '../../dialogs/d20RollDialog.mjs';

const fields = foundry.data.fields;

/*
    !!! I'm currently refactoring the whole Action thing, it's a WIP !!!
*/

/*
    ToDo
    - Add setting and/or checkbox for cost and damage like
    - Target Check / Target Picker
    - Range Check
    - Area of effect and measurement placement
    - Summon Action create method

    Other
    - Auto use action   <= Into Roll
*/

export class DHBaseAction extends foundry.abstract.DataModel {
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
            actionType: new fields.StringField({ choices: SYSTEM.ITEM.actionTypes, initial: 'action', nullable: true }),
            cost: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({
                        choices: SYSTEM.GENERAL.abilityCosts,
                        nullable: false,
                        required: true,
                        initial: 'hope'
                    }),
                    value: new fields.NumberField({ nullable: true, initial: 1 }),
                    scalable: new fields.BooleanField({ initial: false }),
                    step: new fields.NumberField({ nullable: true, initial: null })
                })
            ),
            uses: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                max: new fields.NumberField({ nullable: true, initial: null }),
                recovery: new fields.StringField({
                    choices: SYSTEM.GENERAL.refreshTypes,
                    initial: null,
                    nullable: true
                })
            }),
            range: new fields.StringField({
                choices: SYSTEM.GENERAL.range,
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
                roll: new fields.SchemaField({
                    type: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.GENERAL.rollTypes }),
                    trait: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.ACTOR.abilities }),
                    difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
                    bonus: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
                }),
                save: new fields.SchemaField({
                    trait: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.ACTOR.abilities }),
                    difficulty: new fields.NumberField({ nullable: true, initial: 10, integer: true, min: 0 }),
                    damageMod: new fields.StringField({ initial: SYSTEM.ACTIONS.damageOnSave.none.id, choices: SYSTEM.ACTIONS.damageOnSave })
                }),
                target: new fields.SchemaField({
                    type: new fields.StringField({
                        choices: SYSTEM.ACTIONS.targetTypes,
                        initial: SYSTEM.ACTIONS.targetTypes.any.id,
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
                        choices: SYSTEM.GENERAL.healingTypes,
                        required: true,
                        blank: false,
                        initial: SYSTEM.GENERAL.healingTypes.hitPoints.id,
                        label: 'Healing'
                    }),
                    resultBased: new fields.BooleanField({ initial: false, label: "DAGGERHEART.Actions.Settings.ResultBased.label" }),
                    value: new fields.EmbeddedDataField(DHActionDiceData),
                    valueAlt: new fields.EmbeddedDataField(DHActionDiceData),
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
        return this.item instanceof DhpActor ? this.item : this.item?.actor;
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/chat/duality-roll.hbs';
    }

    static getRollType(parent) {
        return 'ability';
    }

    static getSourceConfig(parent) {
        const updateSource = {};
        updateSource.img ??= parent?.img ?? parent?.system?.img;
        if (parent?.system?.trait) {
            updateSource['roll'] = {
                type: this.getRollType(parent),
                trait: parent.system.trait
            };
        }
        if (parent?.type === 'weapon' && !!this.schema.fields.damage) {
            updateSource['damage'] = { includeBase: true };
        }
        if (parent?.system?.range) {
            updateSource['range'] = parent?.system?.range;
        }
        return updateSource;
    }

    getRollData() {
        const actorData = this.actor.getRollData(false);

        // Remove when included directly in Actor getRollData
        actorData.prof = actorData.proficiency?.value ?? 1,
        actorData.cast = actorData.spellcast?.value ?? 1,
        actorData.scale = this.cost.length
                ? this.cost.reduce((a, c) => {
                      a[c.type] = c.value;
                      return a;
                  }, {})
                : 1,
        actorData.roll = {}

        return actorData;
    }

    async use(event, ...args) {
        const isFastForward = event.shiftKey || (!this.hasRoll && !this.hasSave);
        // Prepare base Config
        const initConfig = this.initActionConfig(event);
        // let config = this.initActionConfig(event);

        // Prepare Targets
        const targetConfig = this.prepareTarget();
        if (isFastForward && !targetConfig) return ui.notifications.warn('Too many targets selected for that actions.');
        // config = this.prepareTarget(config);

        // Prepare Range
        const rangeConfig = this.prepareRange();
        // config = this.prepareRange(config);

        // Prepare Costs
        const costsConfig = this.prepareCost();
        if(isFastForward && !this.hasCost(costsConfig)) return ui.notifications.warn("You don't have the resources to use that action.");
        // config = this.prepareUseCost(config)

        // Prepare Uses
        const usesConfig = this.prepareUse();
        if(isFastForward && !this.hasUses(usesConfig)) return ui.notifications.warn("That action doesn't have remaining uses.");
        // config = this.prepareUseCost(config)

        // Prepare Roll Data
        const actorData = this.getRollData();

        let config = {
            ...initConfig,
            targets: targetConfig,
            range: rangeConfig,
            costs: costsConfig,
            uses: usesConfig,
            data: actorData
        }
        
        if ( Hooks.call(`${SYSTEM.id}.preUseAction`, this, config) === false ) return;

        // Display configuration window if necessary
        if ( config.dialog.configure && this.requireConfigurationDialog(config) ) {
            config = await D20RollDialog.configure(config);
            if (!config) return;
        }

        if ( this.hasRoll ) {
            const rollConfig = this.prepareRoll(config);
            config.roll = rollConfig;
            config = await this.actor.diceRoll(config);
            if (!config) return;
        }

        if( this.hasSave ) {
            /* config.targets.forEach((t) => {
                if(t.hit) {
                    const target = game.canvas.tokens.get(t.id),
                        actor = target?.actor;
                    console.log(actor)
                    if(!actor) return;
                    actor.saveRoll({
                        event,
                        title: 'Roll Save',
                        roll: {
                            trait: this.save.trait,
                            difficulty: this.save.difficulty
                        },
                        dialog: {
                            configure: false
                        },
                        data: actor.getRollData()
                    }).then(async (result) => {
                        t.saved = result;
                        setTimeout(async () => {
                            const message = ui.chat.collection.get(config.message.id),
                                msgTargets = message.system.targets,
                                msgTarget = msgTargets.find(mt => mt.id === t.id);
                            msgTarget.saved = result;
                            await message.update({'system.targets': msgTargets});
                        },100)
                    })
                }
            }) */
        }

        if ( this.doFollowUp() ) {
            if(this.rollDamage) await this.rollDamage(event, config);
            if(this.rollHealing) await this.rollHealing(event, config);
            if(this.trigger) await this.trigger(event, config);
        }

        // Consume resources
        await this.consume(config);
        
        if ( Hooks.call(`${SYSTEM.id}.postUseAction`, this, config) === false ) return;

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
                // action: this
            },
            dialog: {
                configure: true
            },
            type: this.type,
            hasDamage: !!this.damage?.parts?.length,
            hasHealing: !!this.healing,
            hasEffect: !!this.effects?.length,
            hasSave: this.hasSave
        }
    }

    requireConfigurationDialog(config) {
        return !config.event.shiftkey && !this.hasRoll && (config.costs?.length || config.uses);
    }

    prepareCost() {
        const costs = this.cost?.length ? foundry.utils.deepClone(this.cost) : [];
        return costs;
    }

    prepareUse() {
        const uses = this.uses?.max ? foundry.utils.deepClone(this.uses) : null;
        if (uses && !uses.value) uses.value = 0;
        return uses;
    }

    prepareTarget() {
        let targets;
        if (this.target?.type === SYSTEM.ACTIONS.targetTypes.self.id)
            targets = this.formatTarget(this.actor.token ?? this.actor.prototypeToken);
        targets = Array.from(game.user.targets);
        // foundry.CONST.TOKEN_DISPOSITIONS.FRIENDLY
        if (this.target?.type && this.target.type !== SYSTEM.ACTIONS.targetTypes.any.id) {
            targets = targets.filter(t => this.isTargetFriendly(t));
            if (this.target.amount && targets.length > this.target.amount) targets = [];
        }
        targets = targets.map(t => this.formatTarget(t));
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
            difficulty: this.roll?.difficulty
        };
        return roll;
    }

    doFollowUp(config) {
        return !this.hasRoll;
    }

    async consume(config) {
        const resources = config.costs.filter(c => c.enabled !== false).map(c => {
            return { type: c.type, value: c.total * -1 };
        });
        await this.actor.modifyResource(resources);
        if(config.uses?.enabled) {
            const newActions = foundry.utils.getProperty(this.item.system, this.systemPath).map(x => x.toObject());
            newActions[this.index].uses.value++;
            await this.item.update({ [`system.${this.systemPath}`]: newActions });
        }
    }
    /* */

    /* ROLL */
    get hasRoll() {
        return !!this.roll?.type;
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

    hasCost(costs) {
        const realCosts = this.getRealCosts(costs);
        return realCosts.reduce((a, c) => a && this.actor.system.resources[c.type]?.value >= (c.total ?? c.value), true);
    }
    /* COST */

    /* USES */
    calcUses(uses) {
        if(!uses) return null;
        return {
            ...uses,
            enabled: uses.hasOwnProperty('enabled') ? uses.enabled : true
        };
    }

    hasUses(uses) {
        if(!uses) return true;
        return (uses.hasOwnProperty('enabled') && !uses.enabled) || uses.value + 1 <= uses.max;
    }
    /* USES */

    /* TARGET */
    isTargetFriendly(target) {
        const actorDisposition = this.actor.token
                ? this.actor.token.disposition
                : this.actor.prototypeToken.disposition,
            targetDisposition = target.document.disposition;
        return (
            (this.target.type === SYSTEM.ACTIONS.targetTypes.friendly.id && actorDisposition === targetDisposition) ||
            (this.target.type === SYSTEM.ACTIONS.targetTypes.hostile.id && actorDisposition + targetDisposition === 0)
        );
    }

    formatTarget(actor) {
        return {
            id: actor.id,
            actorId: actor.actor.uuid,
            name: actor.actor.name,
            img: actor.actor.img,
            difficulty: actor.actor.system.difficulty,
            evasion: actor.actor.system.evasion?.total
        };
    }
    /* TARGET */

    /* RANGE */
    
    /* RANGE */

    /* EFFECTS */
    async applyEffects(event, data, force = false) {
        if (!this.effects?.length || !data.system.targets.length) return;
        let effects = this.effects;
        data.system.targets.forEach(async token => {
            if (!token.hit && !force) return;
            if(this.hasSave && token.saved.success === true) {
                effects = this.effects.filter(e => e.onSave === true)
            }
            if(!effects.length) return;
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
        if(!target?.actor) return;
        target.actor.diceRoll({
            event,
            title: 'Roll Save',
            roll: {
                trait: this.save.trait,
                difficulty: this.save.difficulty,
                type: "reaction"
            },
            data: target.actor.getRollData()
        }).then(async (result) => {
            this.updateChatMessage(message, target.id, {result: result.roll.total, success: result.roll.success});
        })
    }

    async updateChatMessage(message, targetId, changes, chain=true) {
        setTimeout(async () => {
            const chatMessage = ui.chat.collection.get(message._id),
                msgTargets = chatMessage.system.targets,
                msgTarget = msgTargets.find(mt => mt.id === targetId);
            msgTarget.saved = changes;
            await chatMessage.update({'system.targets': msgTargets});
        },100);
        if(chain) {
            if(message.system.source.message) this.updateChatMessage(ui.chat.collection.get(message.system.source.message), targetId, changes, false);
            const relatedChatMessages = ui.chat.collection.filter(c => c.system.source.message === message._id);
            relatedChatMessages.forEach(c => {
                this.updateChatMessage(c, targetId, changes, false);
            })
        }
    }
    /* SAVE */
}

export class DHDamageAction extends DHBaseAction {
    static extraSchemas = ['damage', 'target', 'effects'];

    /* async use(event, ...args) {
        const config = await super.use(event, args);
        if (!config || ['error', 'warning'].includes(config.type)) return;
        if (!this.directDamage) return;
        return await this.rollDamage(event, config);
    } */

    getFormulaValue(part, data) {
        let formulaValue = part.value;
        if(this.hasRoll && part.resultBased && data.system.roll.result.duality === -1) return part.valueAlt;
        return formulaValue;
    }

    async rollDamage(event, data) {
        let formula = this.damage.parts.map(p => this.getFormulaValue(p, data).getFormula(this.actor)).join(' + ');

        if (!formula || formula == '') return;
        let roll = { formula: formula, total: formula },
            bonusDamage = [];
        
        const config = {
            title: game.i18n.format('DAGGERHEART.Chat.DamageRoll.Title', { damage: this.name }),
            formula,
            targets: (data.system?.targets.filter(t => t.hit) ?? data.targets),
            hasSave: this.hasSave,
            source: data.system?.source
        };
        if(this.hasSave) config.onSave = this.save.damageMod;
        if(data.system) {
            config.source.message = data._id;
            config.directDamage = false;
        }

        roll = CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }
}

export class DHAttackAction extends DHDamageAction {
    static extraSchemas = [...super.extraSchemas, ...['roll', 'save']];

    static getRollType(parent) {
        return parent.type === 'weapon' ? 'weapon' : 'spellcast';
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/chat/duality-roll.hbs';
    }

    prepareData() {
        super.prepareData();
        if (this.damage.includeBase && !!this.item?.system?.damage) {
            const baseDamage = this.getParentDamage();
            this.damage.parts.unshift(new DHDamageData(baseDamage));
        }
    }

    getParentDamage() {
        return {
            value: {
                multiplier: 'proficiency',
                dice: this.item?.system?.damage.value,
                bonus: this.item?.system?.damage.bonus ?? 0
            },
            type: this.item?.system?.damage.type,
            base: true
        };
    }
}

export class DHHealingAction extends DHBaseAction {
    static extraSchemas = ['target', 'effects', 'healing', 'roll'];

    static getRollType(parent) {
        return 'spellcast';
    }

    getFormulaValue(data) {
        let formulaValue = this.healing.value;
        if(this.hasRoll && this.healing.resultBased && data.system.roll.result.duality === -1) return this.healing.valueAlt;
        return formulaValue;
    }

    async rollHealing(event, data) {
        let formulaValue = this.getFormulaValue(data),
            formula = formulaValue.getFormula(this.actor);

        if (!formula || formula == '') return;
        let roll = { formula: formula, total: formula },
            bonusDamage = [];
        
        const config = {
            title: game.i18n.format('DAGGERHEART.Chat.HealingRoll.Title', {
                healing: game.i18n.localize(SYSTEM.GENERAL.healingTypes[this.healing.type].label)
            }),
            formula,
            targets: (data.system?.targets ?? data.targets).filter(t => t.hit),
            messageType: 'healing',
            type: this.healing.type
        };

        roll = CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/chat/healing-roll.hbs';
    }
}

export class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            documentUUID: new fields.DocumentUUIDField({ type: 'Actor' })
        };
    }

    async trigger(event, ...args) {
        if (!this.canSummon || !canvas.scene) return;
        // const config = await super.use(event, args);
    }

    get canSummon() {
        return game.user.can('TOKEN_CREATE');
    }
}

export class DHEffectAction extends DHBaseAction {
    static extraSchemas = ['effects', 'target'];

    async use(event, ...args) {
        const config = await super.use(event, args);
        if (['error', 'warning'].includes(config.type)) return;
        return await this.chatApplyEffects(event, config);
    }

    async chatApplyEffects(event, data) {
        const cls = getDocumentClass('ChatMessage'),
            systemData = {
                title: game.i18n.format('DAGGERHEART.Chat.ApplyEffect.Title', { name: this.name }),
                origin: this.actor._id,
                description: '',
                targets: data.targets.map(x => ({ id: x.id, name: x.name, img: x.img, hit: true })),
                action: {
                    itemId: this.item._id,
                    actionId: this._id
                }
            },
            msg = new cls({
                type: 'applyEffect',
                user: game.user.id,
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/chat/apply-effects.hbs',
                    systemData
                )
            });

        cls.create(msg.toObject());
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/chat/apply-effects.hbs';
    }
}

export class DHMacroAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            documentUUID: new fields.DocumentUUIDField({ type: 'Macro' })
        };
    }

    async trigger(event, ...args) {
        // const config = await super.use(event, args);
        // if (['error', 'warning'].includes(config.type)) return;
        const fixUUID = !this.documentUUID.includes('Macro.') ? `Macro.${this.documentUUID}` : this.documentUUID,
            macro = await fromUuid(fixUUID);
        try {
            if (!macro) throw new Error(`No macro found for the UUID: ${this.documentUUID}.`);
            macro.execute();
        } catch (error) {
            ui.notifications.error(error);
        }
    }
}
