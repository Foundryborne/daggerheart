import DHActionConfig from '../../applications/sheets-configs/action-config.mjs';
import { itemAbleRollParse } from '../../helpers/utils.mjs';
import MappingField from './mappingField.mjs';

/**
 * Specialized collection type for stored actions.
 * @param {DataModel} model     The parent DataModel to which this ActionCollection belongs.
 * @param {Action[]} entries  The actions to store.
 */
export class ActionCollection extends Collection {
    constructor(model, entries) {
        super();
        this.#model = model;
        for (const entry of entries) {
            if (!(entry instanceof game.system.api.models.actions.actionsTypes.base)) continue;
            this.set(entry._id, entry);
        }
    }

    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /**
     * The parent DataModel to which this ActionCollection belongs.
     * @type {DataModel}
     */
    #model;

    /* -------------------------------------------- */

    /* -------------------------------------------- */
    /*  Methods                                     */
    /* -------------------------------------------- */

    /* -------------------------------------------- */

    /**
     * Test the given predicate against every entry in the Collection.
     * @param {function(*, number, ActionCollection): boolean} predicate  The predicate.
     * @returns {boolean}
     */
    every(predicate) {
        return this.reduce((pass, v, i) => pass && predicate(v, i, this), true);
    }

    /* -------------------------------------------- */

    /**
     * Convert the ActionCollection to an array of simple objects.
     * @param {boolean} [source=true]  Draw data for contained Documents from the underlying data source?
     * @returns {object[]}             The extracted array of primitive objects.
     */
    toObject(source = true) {
        return this.map(doc => doc.toObject(source));
    }
}

/* -------------------------------------------- */

/**
 * Field that stores actions.
 */
export class ActionsField extends MappingField {
    constructor(options) {
        super(new ActionField(), options);
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    initialize(value, model, options) {
        const actions = Object.values(super.initialize(value, model, options));
        return new ActionCollection(model, actions);
    }
}

/* -------------------------------------------- */

/**
 * Field that stores action data and swaps class based on action type.
 */
export class ActionField extends foundry.data.fields.ObjectField {
    getModel(value) {
        return game.system.api.models.actions.actionsTypes[value.type] ?? null;
    }

    /* -------------------------------------------- */

    /** @override */
    _cleanType(value, options) {
        if (!(typeof value === 'object')) value = {};
        const cls = this.getModel(value);
        if (cls) return cls.cleanData(value, options);
        return value;
    }

    /* -------------------------------------------- */

    /** @override */
    initialize(value, model, options = {}) {
        const cls = this.getModel(value);
        if (cls) return new cls(value, { parent: model, ...options });
        return foundry.utils.deepClone(value);
    }

    /* -------------------------------------------- */

    /**
     * Migrate this field's candidate source data.
     * @param {object} sourceData  Candidate source data of the root model.
     * @param {any} fieldData      The value of this field within the source data.
     */
    migrateSource(sourceData, fieldData) {
        const cls = this.getModel(fieldData);
        if (cls) cls.migrateDataSafe(fieldData);
    }
}

/* -------------------------------------------- */

export function ActionMixin(Base) {
    class Action extends Base {
        static metadata = Object.freeze({
            name: 'Action',
            label: 'DAGGERHEART.GENERAL.Action.single',
            sheetClass: DHActionConfig
        });

        static _sheets = new Map();

        static get documentName() {
            return this.metadata.name;
        }

        get documentName() {
            return this.constructor.documentName;
        }

        static defaultName() {
            return this.documentName;
        }

        get relativeUUID() {
            return `.Item.${this.item.id}.Action.${this.id}`;
        }

        get uuid() {
            return `${this.item.uuid}.${this.documentName}.${this.id}`;
        }

        get sheet() {
            if (!this.constructor._sheets.has(this.uuid)) {
                const sheet = new this.constructor.metadata.sheetClass(this);
                this.constructor._sheets.set(this.uuid, sheet);
            }
            return this.constructor._sheets.get(this.uuid);
        }

        get inCollection() {
            return foundry.utils.getProperty(this.parent, this.systemPath) instanceof Collection;
        }

        get remainingUses() {
            if (!this.uses) return null;

            return Math.max(
                (this.uses.max ? itemAbleRollParse(this.uses.max, this.actor) : 0) - (this.uses.value ?? 0),
                0
            );
        }

        static async create(data, operation = {}) {
            const { parent, renderSheet } = operation;
            let { type } = data;
            if (!type || !game.system.api.models.actions.actionsTypes[type]) {
                ({ type } =
                    (await foundry.applications.api.DialogV2.input({
                        window: { title: game.i18n.localize('DAGGERHEART.CONFIG.SelectAction.selectType') },
                        position: { width: 300 },
                        classes: ['daggerheart', 'dh-style'],
                        content: await foundry.applications.handlebars.renderTemplate(
                            'systems/daggerheart/templates/actionTypes/actionType.hbs',
                            {
                                types: CONFIG.DH.ACTIONS.actionTypes,
                                itemName: parent.parent?.name
                            }
                        ),
                        ok: {
                            label: game.i18n.format('DOCUMENT.Create', {
                                type: game.i18n.localize('DAGGERHEART.GENERAL.Action.single')
                            })
                        }
                    })) ?? {});
            }
            if (!type) return;

            const cls = game.system.api.models.actions.actionsTypes[type];
            const action = new cls(
                {
                    type,
                    ...cls.getSourceConfig(parent)
                },
                {
                    parent
                }
            );
            const created = await parent.parent.update({ [`system.actions.${action.id}`]: action.toObject() });
            const newAction = created.system.actions.get(action.id);
            if (!newAction) return null;
            if (renderSheet) newAction.sheet.render({ force: true });
            return newAction;
        }

        async update(updates, options = {}) {
            const isSetting = !this.parent.parent;
            const basePath = isSetting ? this.systemPath : `system.${this.systemPath}`;
            const path = this.inCollection ? `${basePath}.${this.id}` : basePath;
            let result = null;
            if (isSetting) {
                await this.parent.updateSource({ [path]: updates }, options);
                result = this.parent;
            } else {
                result = await this.item.update({ [path]: updates }, options);
            }

            return this.inCollection
                ? foundry.utils.getProperty(result, basePath)?.get(this.id)
                : foundry.utils.getProperty(result, basePath);
        }

        delete() {
            if (!this.inCollection) return this.item;
            const action = foundry.utils.getProperty(this.item, `system.${this.systemPath}`)?.get(this.id);
            if (!action) return this.item;
            this.item.update({ [`system.${this.systemPath}.-=${this.id}`]: null });
            this.constructor._sheets.get(this.uuid)?.close();
        }

        async deleteDialog() {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize(`DAGGERHEART.GENERAL.Action.single`),
                        name: this.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', {
                    name: this.name
                })
            });
            if (!confirmed) return;
            return this.delete();
        }

        async toChat(origin) {
            const cls = getDocumentClass('ChatMessage');
            const systemData = {
                title: game.i18n.localize('DAGGERHEART.CONFIG.ActionType.action'),
                origin: origin,
                action: { name: this.name, img: this.img, tags: this.tags ? this.tags : ['Spell', 'Arcana', 'Lv 10'] },
                itemOrigin: this.item,
                description: this.description
            };
            const msg = {
                type: 'abilityUse',
                user: game.user.id,
                actor: { name: this.actor.name, img: this.actor.img },
                author: this.author,
                speaker: cls.getSpeaker(),
                title: game.i18n.localize('DAGGERHEART.UI.Chat.action.title'),
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/ui/chat/action.hbs',
                    systemData
                ),
                flags: {
                    daggerheart: {
                        cssClass: 'dh-chat-message dh-style'
                    }
                }
            };

            ChatMessage.applyRollMode(msg, game.settings.get('core', 'rollMode'));
            cls.create(msg);
        }
    }

    return Action;
}
