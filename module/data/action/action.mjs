import DamageSelectionDialog from '../../applications/damageSelectionDialog.mjs';
import CostSelectionDialog from '../../applications/costSelectionDialog.mjs';
import { abilities } from '../../config/actorConfig.mjs';
import { DHActionDiceData, DHDamageData, DHDamageField } from './actionDice.mjs';
import DhpActor from '../../documents/actor.mjs';

const fields = foundry.data.fields;

/*
    ToDo
    - Add setting for Hope/Fear result on Damage, Heal, Resource (Handle Roll result as part of formula if needed)
    - Add setting and/or checkbox for cost and damage like
    - Target Check / Target Picker
    - Range Check
    - Area of effect and measurement placement
    - Summon Action create method

    - Create classes form Target, Cost, etc ?

    Other
    - Add optionnal Role for Healing ?
    - Auto use action   <= Into Roll

    Done
    - Cost Check
    - Auto use costs
    - Auto disable selected Cost from other cost list
    - Apply ActiveEffect => Add to Chat message like Damage Button ?
    - Add Drag & Drop for documentUUID field (Macro & Summon)

    Activity Types List
    - Attack => Weapon Attack, Spell Attack, etc...
    - Effects => Like Attack without damage
    - Damage => Like Attack without roll
    - Healing
    - Resource => Merge Healing & Resource ?
    - Summon
    - Sequencer => Trigger a list of Activities set on the item one by one
    - Macro

    Actor Modifier
    - Weapon Attack
    - Spell Attack
    - Weapon Damage
    - Magical Damage
    - Physical Damage ?
    - Magical Damage ?
    - Healing
    - Bard Rally (Math.ceil(LeveL / 5))
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
                    difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
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
                        _id: new fields.DocumentIdField()
                    })
                ),
                healing: new fields.SchemaField({
                    type: new fields.StringField({
                        choices: SYSTEM.GENERAL.healingTypes,
                        required: true,
                        blank: false,
                        initial: SYSTEM.GENERAL.healingTypes.health.id,
                        label: 'Healing'
                    }),
                    value: new fields.EmbeddedDataField(DHActionDiceData)
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
        return {
            ...actorData.toObject(),
            prof: actorData.proficiency?.value ?? 1,
            cast: actorData.spellcast?.value ?? 1,
            scale: this.cost.length
                ? this.cost.reduce((a, c) => {
                      a[c.type] = c.value;
                      return a;
                  }, {})
                : 1,
            roll: {}
        };
    }

    async use(event, ...args) {
        let config = {
            event,
            title: this.item.name,
            source: {
                item: this.item._id,
                action: this._id
                // action: this
            },
            type: this.type,
            hasDamage: !!this.damage?.parts?.length,
            hasHealing: !!this.healing,
            hasEffect: !!this.effects?.length
        };

        // this.proceedChatDisplay(config);

        // Filter selected targets based on Target parameters
        config.targets = await this.getTarget(config);
        if (!config.targets) return ui.notifications.warn('Too many targets selected for that actions.');

        // Filter selected targets based on Range parameters
        config.range = await this.checkRange(config);
        if (!config.range.hasRange) return ui.notifications.warn('No Target within range.');

        // Display Uses/Costs Dialog & Check if Actor get enough resources
        config = {
            ...config,
            ...(await this.getCost(config))
        };
        if (!this.hasRoll() && (!config.costs.hasCost || !this.hasUses(config.uses)))
            return ui.notifications.warn("You don't have the resources to use that action.");

        // Proceed with Roll
        config = await this.proceedRoll(config);
        if (this.roll && !config.roll.result) return;

        // Update Actor resources based on Action Cost configuration
        this.spendCost(config.costs.values);
        this.spendUses(config.uses);

        return config;
    }

    /* ROLL */
    hasRoll() {
        // return this.roll?.type && this.roll?.trait;
        return this.roll?.type;
    }

    async proceedRoll(config) {
        if (!this.hasRoll()) return config;
        // const modifierValue = this.actor.system.traits[this.roll.trait].value;
        config = {
            ...config,
            roll: {
                modifiers: [],
                trait: this.roll?.trait,
                // label: game.i18n.localize(abilities[this.roll.trait].label),
                label: 'Attack',
                type: this.actionType,
                difficulty: this.roll?.difficulty
            }
        };
        // config = await this.actor.diceRoll(config, this);
        return this.actor.diceRoll(config, this);
    }
    /* ROLL */

    /* COST */
    async getCost(config) {
        let costs = this.cost?.length ? foundry.utils.deepClone(this.cost) : { values: [], hasCost: true };
        let uses = this.getUses();
        if (!config.event.shiftKey && !this.hasRoll()) {
            const dialogClosed = new Promise((resolve, _) => {
                new CostSelectionDialog(costs, uses, this, resolve).render(true);
            });
            ({ costs, uses } = await dialogClosed);
        }
        return { costs, uses };
    }

    getRealCosts(costs) {
        const realCosts = costs?.length ? costs.filter(c => c.enabled) : [];
        return { values: realCosts, hasCost: this.hasCost(realCosts) };
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
        return costs.reduce((a, c) => a && this.actor.system.resources[c.type]?.value >= (c.total ?? c.value), true);
    }

    async spendCost(config) {
        if (!config.costs?.values?.length) return;
        return await this.actor.modifyResource(config.costs.values);
    }
    /* COST */

    /* USES */
    async spendUses(config) {
        if (!this.uses.max || config.enabled === false) return;
        const newActions = foundry.utils.getProperty(this.item.system, this.systemPath).map(x => x.toObject());
        newActions[this.index].uses.value++;
        await this.item.update({ [`system.${this.systemPath}`]: newActions });
    }

    getUses() {
        if (!this.uses) return { hasUse: true };
        const uses = foundry.utils.deepClone(this.uses);
        if (!uses.value) uses.value = 0;
        return uses;
    }

    calcUses(uses) {
        return {
            ...uses,
            enabled: uses.hasOwnProperty('enabled') ? uses.enabled : true
        };
    }

    hasUses(uses) {
        return !uses.enabled || uses.value + 1 <= uses.max;
    }
    /* USES */

    /* TARGET */
    async getTarget(config) {
        if (this.target?.type === SYSTEM.ACTIONS.targetTypes.self.id)
            return this.formatTarget(this.actor.token ?? this.actor.prototypeToken);
        let targets = Array.from(game.user.targets);
        // foundry.CONST.TOKEN_DISPOSITIONS.FRIENDLY
        if (this.target?.type && this.target.type !== SYSTEM.ACTIONS.targetTypes.any.id) {
            targets = targets.filter(t => this.isTargetFriendly(t));
            if (this.target.amount && targets.length > this.target.amount) return false;
        }
        return targets.map(t => this.formatTarget(t));
    }

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
            name: actor.actor.name,
            img: actor.actor.img,
            difficulty: actor.actor.system.difficulty,
            evasion: actor.actor.system.evasion?.total
        };
    }
    /* TARGET */

    /* RANGE */
    async checkRange(config) {
        if (!this.range || !this.actor) return true;
        return { values: [], hasRange: true };
    }
    /* RANGE */

    /* EFFECTS */
    async applyEffects(event, data, force = false) {
        if (!this.effects?.length || !data.system.targets.length) return;
        data.system.targets.forEach(async token => {
            if (!token.hit && !force) return;
            this.effects.forEach(async e => {
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

    /* CHAT */
    async proceedChatDisplay(config) {
        if (!this.chatDisplay) return;
    }
    /* CHAT */
}

export class DHDamageAction extends DHBaseAction {
    directDamage = true;

    static extraSchemas = ['damage', 'target', 'effects'];

    async use(event, ...args) {
        const config = await super.use(event, args);
        if (!config || ['error', 'warning'].includes(config.type)) return;
        if (!this.directDamage) return;
        return await this.rollDamage(event, config);
    }

    async rollDamage(event, data) {
        let formula = this.damage.parts.map(p => p.getFormula(this.actor)).join(' + ');

        if (!formula || formula == '') return;
        let roll = { formula: formula, total: formula },
            bonusDamage = [];

        const config = {
            title: game.i18n.format('DAGGERHEART.Chat.DamageRoll.Title', { damage: this.name }),
            formula,
            targets: (data.system?.targets ?? data.targets).map(x => ({
                id: x.id,
                name: x.name,
                img: x.img,
                hit: true
            }))
        };

        roll = CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }
}

export class DHAttackAction extends DHDamageAction {
    directDamage = false;

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
            multiplier: 'proficiency',
            dice: this.item?.system?.damage.value,
            bonus: this.item?.system?.damage.bonus ?? 0,
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

    async use(event, ...args) {
        const config = await super.use(event, args);
        if (!config || ['error', 'warning'].includes(config.type)) return;
        if (this.hasRoll()) return;
        return await this.rollHealing(event, config);
    }

    async rollHealing(event, data) {
        let formula = this.healing.value.getFormula(this.actor);

        if (!formula || formula == '') return;
        let roll = { formula: formula, total: formula },
            bonusDamage = [];

        const config = {
            title: game.i18n.format('DAGGERHEART.Chat.HealingRoll.Title', {
                healing: game.i18n.localize(SYSTEM.GENERAL.healingTypes[this.healing.type].label)
            }),
            formula,
            targets: (data.system?.targets ?? data.targets).map(x => ({
                id: x.id,
                name: x.name,
                img: x.img,
                hit: true
            })),
            messageTemplate: 'systems/daggerheart/templates/chat/healing-roll.hbs'
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

    async use(event, ...args) {
        if (!this.canSummon || !canvas.scene) return;
        const config = await super.use(event, args);
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

    async use(event, ...args) {
        const config = await super.use(event, args);
        if (['error', 'warning'].includes(config.type)) return;
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
