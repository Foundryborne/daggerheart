import DhpActor from '../../documents/actor.mjs';
import D20RollDialog from '../../applications/dialogs/d20RollDialog.mjs';
import { ActionMixin } from '../fields/actionField.mjs';
import { originItemField } from '../chat-message/actorRoll.mjs';
import TriggerField from '../fields/triggerField.mjs';

const fields = foundry.data.fields;

/*
    ToDo
    - Target Check / Target Picker
    - Range Check
    - Area of effect and measurement placement
    - Summon Action create method
*/

export default class DHBaseAction extends ActionMixin(foundry.abstract.DataModel) {
    static extraSchemas = ['cost', 'uses', 'range'];

    /** @inheritDoc */
    static defineSchema() {
        const schemaFields = {
            _id: new fields.DocumentIdField({ initial: () => foundry.utils.randomID() }),
            systemPath: new fields.StringField({ required: true, initial: 'actions' }),
            type: new fields.StringField({ initial: undefined, readonly: true, required: true }),
            baseAction: new fields.BooleanField({ initial: false }),
            name: new fields.StringField({ initial: undefined }),
            description: new fields.HTMLField(),
            img: new fields.FilePathField({ initial: undefined, categories: ['IMAGE'], base64: false }),
            chatDisplay: new fields.BooleanField({ initial: true, label: 'DAGGERHEART.ACTIONS.Config.displayInChat' }),
            originItem: originItemField(),
            actionType: new fields.StringField({
                choices: CONFIG.DH.ITEM.actionTypes,
                initial: 'action',
                nullable: false,
                required: true
            }),
            targetUuid: new fields.StringField({ initial: undefined }),
            triggers: new fields.ArrayField(new TriggerField())
        };

        this.extraSchemas.forEach(s => {
            let clsField = this.getActionField(s);
            if (clsField) schemaFields[s] = new clsField();
        });

        return schemaFields;
    }

    /**
     * The default values to supply to schema fields when they are created in the actionConfig. Defined by implementing classes.
     */
    get defaultValues() {
        return {};
    }

    /**
     * Create a Map containing each Action step based on fields define in schema. Ordered by Fields order property.
     *
     * Each step can be called individually as long as needed config is provided.
     * Ex: <action>.workflow.get("damage").execute(config)
     * @returns {Map}
     */
    defineWorkflow() {
        const workflow = new Map();
        this.constructor.extraSchemas.forEach(s => {
            let clsField = this.constructor.getActionField(s);
            if (clsField?.execute) {
                workflow.set(s, { order: clsField.order, execute: clsField.execute.bind(this) });
                if (s === 'damage')
                    workflow.set('applyDamage', { order: 75, execute: clsField.applyDamage.bind(this) });
            }
        });
        return new Map([...workflow.entries()].sort(([aKey, aValue], [bKey, bValue]) => aValue.order - bValue.order));
    }

    /**
     * Getter returning the workflow property or creating it the first time the property is called
     */
    get workflow() {
        if (this.hasOwnProperty('_workflow')) return this._workflow;
        const workflow = Object.freeze(this.defineWorkflow());
        Object.defineProperty(this, '_workflow', { value: workflow, writable: false });
        return workflow;
    }

    /**
     * Get the Field class from ActionFields global config
     * @param {string} name Field short name, equal to Action property
     * @returns Action Field
     */
    static getActionField(name) {
        const field = game.system.api.fields.ActionFields[`${name.capitalize()}Field`];
        return fields.DataField.isPrototypeOf(field) && field;
    }

    /** @inheritDoc */
    prepareData() {
        this.name = this.name || game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[this.type].name);
        this.img = this.img ?? this.parent?.parent?.img;

        /* Fallback to feature description */
        this.description = this.description || this.parent?.description;
    }

    /**
     * Get Action ID
     */
    get id() {
        return this._id;
    }

    /**
     * Return Item the action is attached too.
     */
    get item() {
        return this.parent.parent;
    }

    /**
     * Return the first Actor parent found.
     */
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

    /**
     * Prepare base data based on Action Type & Parent Type
     * @param {object} parent
     * @returns {object}
     */
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

    /**
     * Obtain a data object used to evaluate any dice rolls associated with this particular Action
     * @param {object} [data ={}]   Optional data object from previous configuration/rolls
     * @returns {object}
     */
    getRollData(data = {}) {
        const actorData = this.actor ? this.actor.getRollData(false) : {};
        actorData.result = data.roll?.total ?? 1;
        actorData.scale = data.costs?.length // Right now only return the first scalable cost.
            ? (data.costs.find(c => c.scalable)?.total ?? 1)
            : 1;
        actorData.roll = {};

        return actorData;
    }

    /**
     * Execute each part of the Action workflow in order, calling a specific event before and after each part.
     * @param {object} config Config object usually created from prepareConfig method
     */
    async executeWorkflow(config) {
        for (const [key, part] of this.workflow) {
            if (Hooks.call(`${CONFIG.DH.id}.pre${key.capitalize()}Action`, this, config) === false) return;
            if ((await part.execute(config)) === false) return;
            if (Hooks.call(`${CONFIG.DH.id}.post${key.capitalize()}Action`, this, config) === false) return;
        }
    }

    /**
     * Main method to use the Action
     * @param {Event} event Event from the button used to trigger the Action
     * @returns {object}
     */
    async use(event) {
        if (!this.actor) throw new Error("An Action can't be used outside of an Actor context.");

        let config = this.prepareConfig(event);
        if (!config) return;

        config.effects = await game.system.api.data.actions.actionsTypes.base.getEffects(this.actor, this.item);

        if (Hooks.call(`${CONFIG.DH.id}.preUseAction`, this, config) === false) return;

        // Display configuration window if necessary
        if (this.requireConfigurationDialog(config)) {
            config = await D20RollDialog.configure(null, config);
            if (!config) return;
        }

        // Execute the Action Worflow in order based of schema fields
        await this.executeWorkflow(config);
        await config.resourceUpdates.updateResources();

        if (Hooks.call(`${CONFIG.DH.id}.postUseAction`, this, config) === false) return;

        if (this.chatDisplay) await this.toChat();

        return config;
    }

    /**
     * Create the basic config common to every action type
     * @param {Event} event Event from the button used to trigger the Action
     * @returns {object}
     */
    prepareBaseConfig(event) {
        const config = {
            event,
            title: `${this.item instanceof CONFIG.Actor.documentClass ? '' : `${this.item.name}: `}${game.i18n.localize(this.name)}`,
            source: {
                item: this.item._id,
                originItem: this.originItem,
                action: this._id,
                actor: this.actor.uuid
            },
            dialog: {},
            actionType: this.actionType,
            hasRoll: this.hasRoll,
            hasDamage: this.hasDamage,
            hasHealing: this.hasHealing,
            hasEffect: this.hasEffect,
            hasSave: this.hasSave,
            isDirect: !!this.damage?.direct,
            selectedRollMode: game.settings.get('core', 'rollMode'),
            data: this.getRollData(),
            evaluate: this.hasRoll,
            resourceUpdates: new ResourceUpdateMap(this.actor),
            targetUuid: this.targetUuid
        };

        DHBaseAction.applyKeybindings(config);
        return config;
    }

    /**
     * Create the config for that action used for its workflow
     * @param {Event} event Event from the button used to trigger the Action
     * @returns {object}
     */
    prepareConfig(event) {
        const config = this.prepareBaseConfig(event);
        for (const clsField of Object.values(this.schema.fields)) {
            if (clsField?.prepareConfig) if (clsField.prepareConfig.call(this, config) === false) return false;
        }
        return config;
    }

    /**
     * Get the all potentially applicable effects on the actor
     * @param {DHActor} actor The actor performing the action
     * @param {DHItem|DhActor} effectParent The parent of the effect
     * @returns {DhActiveEffect[]}
     */
    static async getEffects(actor, effectParent) {
        if (!actor) return [];

        return Array.from(await actor.allApplicableEffects()).filter(effect => {
            /* Effects on weapons only ever apply for the weapon itself */
            if (effect.parent.type === 'weapon') {
                /* Unless they're secondary - then they apply only to other primary weapons */
                if (effect.parent.system.secondary) {
                    if (effectParent?.type !== 'weapon' || effectParent?.system.secondary) return false;
                } else if (effectParent?.id !== effect.parent.id) return false;
            }

            return !effect.isSuppressed;
        });
    }

    /**
     * Method used to know if a configuration dialog must be shown or not when there is no roll.
     * @param {*} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @returns {boolean}
     */
    requireConfigurationDialog(config) {
        return !config.event.shiftKey && !config.hasRoll && (config.costs?.length || config.uses);
    }

    /**
     * Consume Action configured resources & uses.
     * That method is only used when we want those resources to be consumed outside of the use method workflow.
     * @param {object} config                Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {boolean} successCost
     */
    async consume(config, successCost = false) {
        await this.workflow.get('cost')?.execute(config, successCost);
        await this.workflow.get('uses')?.execute(config, successCost);

        if (config.roll && !config.roll.success && successCost) {
            setTimeout(() => {
                (config.message ?? config.parent).update({ 'system.successConsumed': true });
            }, 50);
        }
    }

    /**
     * Set if a configuration dialog must be shown or not if a special keyboard key is pressed.
     * @param {object} config Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    static applyKeybindings(config) {
        config.dialog.configure ??= !(config.event.shiftKey || config.event.altKey || config.event.ctrlKey);
    }

    /**
     * Getters to know which parts the action is composed of. A field can exist but configured to not be used.
     * @returns {boolean} If that part is in the action.
     */

    get hasRoll() {
        return !!this.roll?.type;
    }

    get hasDamage() {
        return this.damage?.parts?.length && this.type !== 'healing';
    }

    get hasHealing() {
        return this.damage?.parts?.length && this.type === 'healing';
    }

    get hasSave() {
        return !!this.save?.trait;
    }

    get hasEffect() {
        return this.effects?.length > 0;
    }

    /**
     * Generates a list of localized tags for this action.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [game.i18n.localize(`DAGGERHEART.ACTIONS.TYPES.${this.type}.name`)];

        return tags;
    }
}

export class ResourceUpdateMap extends Map {
    #actor;

    constructor(actor) {
        super();

        this.#actor = actor;
    }

    addResources(resources) {
        if (!resources?.length) return;
        const invalidResources = resources.some(resource => !resource.key);
        if (invalidResources) return;

        for (const resource of resources) {
            if (!resource.key) continue;

            const existing = this.get(resource.key);
            if (!existing || resource.clear) {
                this.set(resource.key, resource);
            } else if (!existing?.clear) {
                this.set(resource.key, {
                    ...existing,
                    value: existing.value + (resource.value ?? 0),
                    total: existing.total + (resource.total ?? 0)
                });
            }
        }
    }

    #getResources() {
        return Array.from(this.values());
    }

    async updateResources() {
        if (this.#actor) {
            const target = this.#actor.system.partner ?? this.#actor;
            await target.modifyResource(this.#getResources());
        }
    }
}
