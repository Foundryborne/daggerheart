/**
 * Describes metadata about the item data model type
 * @typedef {Object} ItemDataModelMetadata
 * @property {string} label - A localizable label used on application.
 * @property {string} type - The system type that this data model represents.
 * @property {boolean} hasDescription - Indicates whether items of this type have description field
 * @property {boolean} isQuantifiable - Indicates whether items of this type have quantity field
 * @property {boolean} isInventoryItem- Indicates whether items of this type is a Inventory Item
 */

const fields = foundry.data.fields;

export default class BaseDataItem extends foundry.abstract.TypeDataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ITEMS'];

    /** @returns {ItemDataModelMetadata}*/
    static get metadata() {
        return {
            label: 'Base Item',
            type: 'base',
            hasDescription: false,
            hasResource: false,
            isQuantifiable: false,
            isInventoryItem: false
        };
    }

    /**@returns {ItemDataModelMetadata}*/
    get metadata() {
        return this.constructor.metadata;
    }

    /** @inheritDoc */
    static defineSchema() {
        const schema = {};

        if (this.metadata.hasDescription) schema.description = new fields.HTMLField({ required: true, nullable: true });

        if (this.metadata.hasResource) {
            schema.resource = new fields.SchemaField(
                {
                    type: new fields.StringField({
                        choices: CONFIG.DH.ITEM.itemResourceTypes,
                        initial: CONFIG.DH.ITEM.itemResourceTypes.simple
                    }),
                    value: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
                    max: new fields.StringField({ nullable: true, initial: null }),
                    icon: new fields.StringField(),
                    recovery: new fields.StringField({
                        choices: CONFIG.DH.GENERAL.refreshTypes,
                        initial: null,
                        nullable: true
                    }),
                    diceStates: new fields.TypedObjectField(
                        new fields.SchemaField({
                            value: new fields.NumberField({ integer: true, nullable: true, initial: null }),
                            used: new fields.BooleanField({ initial: false })
                        })
                    ),
                    dieFaces: new fields.StringField({ initial: '4' })
                },
                { nullable: true, initial: null }
            );
        }

        if (this.metadata.isQuantifiable)
            schema.quantity = new fields.NumberField({ integer: true, initial: 1, min: 0, required: true });

        return schema;
    }

    /**
     * Convenient access to the item's actor, if it exists.
     * @returns {foundry.documents.Actor | null}
     */
    get actor() {
        return this.parent.actor;
    }

    get actionsList() {
        return this.actions;
    }

    /**
     * Obtain a data object used to evaluate any dice rolls associated with this Item Type
     * @param {object} [options] - Options which modify the getRollData method.
     * @returns {object}
     */
    getRollData(options = {}) {
        const actorRollData = this.actor?.getRollData() ?? {};
        const data = { ...actorRollData, item: { ...this } };
        return data;
    }

    async _preCreate(data, options, user) {
        // Skip if no initial action is required or actions already exist
        if (this.metadata.hasInitialAction && foundry.utils.isEmpty(this.actions)) {
            const metadataType = this.metadata.type;
            const actionType = { weapon: 'attack' }[metadataType];
            const ActionClass = game.system.api.models.actions.actionsTypes[actionType];

            const action = new ActionClass(
                {
                    _id: foundry.utils.randomID(),
                    type: actionType,
                    name: game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[actionType].name),
                    ...ActionClass.getSourceConfig(this.parent)
                },
                {
                    parent: this.parent
                }
            );

            this.updateSource({ actions: [action] });
        }
    }

    _onCreate(data) {
        if (!this.actor || this.actor.type !== 'character' || !this.features) return;

        this.actor.createEmbeddedDocuments(
            'Item',
            this.features.map(feature => ({
                ...feature,
                system: {
                    ...feature.system,
                    originItemType: this.parent.type,
                    originId: data._id,
                    identifier: feature.identifier
                }
            }))
        );
    }

    async _preDelete() {
        if (!this.actor || this.actor.type !== 'character') return;

        const items = this.actor.items.filter(item => item.system.originId === this.parent.id);
        if (items.length > 0)
            await this.actor.deleteEmbeddedDocuments(
                'Item',
                items.map(x => x.id)
            );
    }
}
