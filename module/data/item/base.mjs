/**
 * Describes metadata about the item data model type
 * @typedef {Object} ItemDataModelMetadata
 * @property {string} label - A localizable label used on application.
 * @property {string} type - The system type that this data model represents.
 * @property {boolean} hasDescription - Indicates whether items of this type have description field
 * @property {boolean} isQuantifiable - Indicates whether items of this type have quantity field
 * @property {boolean} isInventoryItem- Indicates whether items of this type is a Inventory Item
 */

import { addLinkedItemsDiff, createScrollText, getScrollTextData, updateLinkedItemApps } from '../../helpers/utils.mjs';
import { ActionsField } from '../fields/actionField.mjs';
import FormulaField from '../fields/formulaField.mjs';

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
            isInventoryItem: false,
            hasActions: false,
            hasAttribution: true
        };
    }

    /**@returns {ItemDataModelMetadata}*/
    get metadata() {
        return this.constructor.metadata;
    }

    /** @inheritDoc */
    static defineSchema() {
        const schema = {
            attribution: new fields.SchemaField({
                source: new fields.StringField(),
                page: new fields.NumberField(),
                artist: new fields.StringField()
            })
        };

        if (this.metadata.hasDescription) schema.description = new fields.HTMLField({ required: true, nullable: true });

        if (this.metadata.hasResource) {
            schema.resource = new fields.SchemaField(
                {
                    type: new fields.StringField({
                        choices: CONFIG.DH.ITEM.itemResourceTypes,
                        initial: CONFIG.DH.ITEM.itemResourceTypes.simple
                    }),
                    value: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
                    max: new FormulaField({ nullable: true, initial: null, deterministic: true }),
                    icon: new fields.StringField(),
                    recovery: new fields.StringField({
                        choices: CONFIG.DH.GENERAL.refreshTypes,
                        initial: null,
                        nullable: true
                    }),
                    progression: new fields.StringField({
                        required: true,
                        choices: CONFIG.DH.ITEM.itemResourceProgression,
                        initial: CONFIG.DH.ITEM.itemResourceProgression.increasing.id
                    }),
                    diceStates: new fields.TypedObjectField(
                        new fields.SchemaField({
                            value: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
                            used: new fields.BooleanField({ initial: false })
                        })
                    ),
                    dieFaces: new fields.StringField({
                        choices: CONFIG.DH.GENERAL.diceTypes,
                        initial: CONFIG.DH.GENERAL.diceTypes.d4
                    })
                },
                { nullable: true, initial: null }
            );
        }

        if (this.metadata.isQuantifiable)
            schema.quantity = new fields.NumberField({ integer: true, initial: 1, min: 0, required: true });

        if (this.metadata.hasActions) schema.actions = new ActionsField();

        return schema;
    }

    /* -------------------------------------------- */

    /**
     * The default icon used for newly created Item documents
     * @type {string}
     */
    static DEFAULT_ICON = null;

    /* -------------------------------------------- */

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

    get itemFeatures() {
        return [];
    }

    get attributionLabel() {
        if (!this.attribution) return;

        const { source, page } = this.attribution;
        return [source, page ? `pg ${page}.` : null].filter(x => x).join('. ');
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

        if (this.actor && this.actor.type === 'character' && this.features) {
            const featureUpdates = {};
            for (let f of this.features) {
                const fBase = f.item ?? f;
                const feature = fBase.system ? fBase : await foundry.utils.fromUuid(fBase.uuid);
                const createData = foundry.utils.mergeObject(
                    feature.toObject(),
                    {
                        system: {
                            originItemType: this.parent.type,
                            originId: data._id,
                            identifier: this.isMulticlass ? 'multiclass' : null
                        }
                    },
                    { inplace: false }
                );
                const [doc] = await this.actor.createEmbeddedDocuments('Item', [createData]);

                if (!featureUpdates.features)
                    featureUpdates.features = this.features.map(x => (x.item ? { ...x, item: x.item.uuid } : x.uuid));

                if (f.item) {
                    const existingFeature = featureUpdates.features.find(x => x.item === f.item.uuid);
                    existingFeature.item = doc.uuid;
                } else {
                    const replaceIndex = featureUpdates.features.findIndex(x => x === f.uuid);
                    featureUpdates.features.splice(replaceIndex, 1, doc.uuid);
                }
            }

            await this.updateSource(featureUpdates);
        }
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

    async _preUpdate(changed, options, userId) {
        const allowed = await super._preUpdate(changed, options, userId);
        if (allowed === false) return false;

        addLinkedItemsDiff(changed.system?.features, this.features, options);

        const autoSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        const armorChanged =
            changed.system?.marks?.value !== undefined && changed.system.marks.value !== this.marks.value;
        if (armorChanged && autoSettings.resourceScrollTexts && this.parent.parent?.type === 'character') {
            const armorData = getScrollTextData(this.parent.parent.system.resources, changed.system.marks, 'armor');
            options.scrollingTextData = [armorData];
        }
    }

    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        updateLinkedItemApps(options, this.parent.sheet);

        if (this.parent?.parent && options.scrollingTextData)
            this.parent.parent.queueScrollText(options.scrollingTextData);
    }
}
