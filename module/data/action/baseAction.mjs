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
            chatDisplay: new fields.BooleanField({ initial: true, label: 'DAGGERHEART.ACTIONS.Config.displayInChat' }),
            actionType: new fields.StringField({
                choices: CONFIG.DH.ITEM.actionTypes,
                initial: 'action',
                nullable: true
            })
        };

        this.extraSchemas.forEach(s => {
            let clsField;
            if ((clsField = this.getActionField(s)))
                schemaFields[s] = new clsField();
        });

        return schemaFields;
    }

    defineWorkflow() {
        const workflow = new Map();
        Object.entries(this.schema.fields).forEach(([k,s]) => {
            if(s.execute) workflow.set(k, { order: s.order, execute: s.execute.bind(this) } );
        });
        if(this.schema.fields.damage) workflow.set("applyDamage", { order: 75, execute: game.system.api.fields.ActionFields.DamageField.applyDamage.bind(this) } );
        return new Map([...workflow.entries()].sort(([aKey, aValue], [bKey, bValue]) => aValue.order - bValue.order));
    }

    get workflow() {
        if ( this.hasOwnProperty("_workflow") ) return this._workflow;
        const workflow = Object.freeze(this.defineWorkflow());
        Object.defineProperty(this, "_workflow", {value: workflow, writable: false});
        return workflow;
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

    async executeWorkflow(config) {
        for(const [key, part] of this.workflow) {
            if (Hooks.call(`${CONFIG.DH.id}.pre${key.capitalize()}Action`, this, config) === false) return;
            if(await part.execute(config) === false) return;
            if (Hooks.call(`${CONFIG.DH.id}.post${key.capitalize()}Action`, this, config) === false) return;
        }
    }

    async use(event, options = {}) {
        if (!this.actor) throw new Error("An Action can't be used outside of an Actor context.");

        if (this.chatDisplay) await this.toChat();

        let config = this.prepareConfig(event);

        /* Object.values(this.schema.fields).forEach( clsField => {
            if (clsField?.prepareConfig) {
                // const keep = clsField.prepareConfig.call(this, config);
                // if (config.isFastForward && !keep) return;
                if(clsField.prepareConfig.call(this, config) === false) return;
            }
        }) */

        if (Hooks.call(`${CONFIG.DH.id}.preUseAction`, this, config) === false) return;

        // Display configuration window if necessary
        if (this.requireConfigurationDialog(config)) {
            config = await D20RollDialog.configure(null, config);
            if (!config) return;
        }
        
        // Execute the Action Worflow in order based of schema fields
        await this.executeWorkflow(config);

        // Consume resources
        await this.consume(config);

        if (Hooks.call(`${CONFIG.DH.id}.postUseAction`, this, config) === false) return;

        return config;
    }

    /* */
    prepareBaseConfig(event) {
        const config = {
            event,
            title: `${this.item.name}: ${game.i18n.localize(this.name)}`,
            source: {
                item: this.item._id,
                action: this._id,
                actor: this.actor.uuid
            },
            dialog: {
                // configure: this.hasRoll
            },
            type: this.type,
            hasRoll: this.hasRoll,
            hasDamage: this.hasDamagePart && this.type !== 'healing',
            hasHealing: this.hasDamagePart && this.type === 'healing',
            hasEffect: !!this.effects?.length,
            hasSave: this.hasSave,
            isDirect: !!this.damage?.direct,
            selectedRollMode: game.settings.get('core', 'rollMode'),
            // isFastForward: event.shiftKey,
            data: this.getRollData(),
            evaluate: this.hasRoll
        };
        DHBaseAction.applyKeybindings(config);
        return config;
    }

    prepareConfig(event) {
        const config = this.prepareBaseConfig(event);
        Object.values(this.schema.fields).forEach( clsField => {
            if (clsField?.prepareConfig) {
                // const keep = clsField.prepareConfig.call(this, config);
                // if (config.isFastForward && !keep) return;
                if(clsField.prepareConfig.call(this, config) === false) return;
            }
        })
        return config;
    }

    requireConfigurationDialog(config) {
        return !config.event.shiftKey && !config.hasRoll && (config.costs?.length || config.uses);
    }

    async consume(config, successCost = false) {
        await game.system.api.fields.ActionFields.CostField.consume.call(this, config, successCost);
        await game.system.api.fields.ActionFields.UsesField.consume.call(this, config, successCost);

        if (config.roll && !config.roll.success && successCost) {
            setTimeout(() => {
                (config.message ?? config.parent).update({ 'system.successConsumed': true });
            }, 50);
        }
    }

    static applyKeybindings(config) {
        config.dialog.configure ??= !(config.event.shiftKey || config.event.altKey || config.event.ctrlKey);
    }

    /**
     * Getters to know which parts the action of composed of. A field can exist but configured to not be used.
     * @returns {boolean} Does that part in the action.
     */

    get hasRoll() {
        return !!this.roll?.type;
    }

    get hasDamagePart() {
        return this.damage?.parts?.length;
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
        const tags = [
            game.i18n.localize(`DAGGERHEART.ACTIONS.TYPES.${this.type}.name`),
            game.i18n.localize(`DAGGERHEART.CONFIG.ActionType.${this.actionType}`)
        ];

        return tags;
    }
}
