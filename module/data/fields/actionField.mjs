import DHActionConfig from "../../applications/sheets-configs/action-config.mjs";

/**
 * Specialized collection type for stored actions.
 * @param {DataModel} model     The parent DataModel to which this ActionCollection belongs.
 * @param {Action[]} entries  The actions to store.
 */
export class ActionCollection extends Collection {
  constructor(model, entries) {
    super();
    this.#model = model;
    for ( const entry of entries ) {
      if ( !(entry instanceof game.system.api.models.actions.actionsTypes.base) ) continue;
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
  toObject(source=true) {
    return this.map(doc => doc.toObject(source));
  }
}

/* -------------------------------------------- */

/**
 * A subclass of ObjectField that represents a mapping of keys to the provided DataField type.
 *
 * @param {DataField} model                    The class of DataField which should be embedded in this field.
 * @param {MappingFieldOptions} [options={}]   Options which configure the behavior of the field.
 * @property {string[]} [initialKeys]          Keys that will be created if no data is provided.
 * @property {MappingFieldInitialValueBuilder} [initialValue]  Function to calculate the initial value for a key.
 * @property {boolean} [initialKeysOnly=false]  Should the keys in the initialized data be limited to the keys provided
 *                                              by `options.initialKeys`?
 */
export class MappingField extends foundry.data.fields.ObjectField {
  constructor(model, options) {
    if ( !(model instanceof foundry.data.fields.DataField) ) {
      throw new Error("MappingField must have a DataField as its contained element");
    }
    super(options);

    /**
     * The embedded DataField definition which is contained in this field.
     * @type {DataField}
     */
    this.model = model;
    model.parent = this;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      initialKeys: null,
      initialValue: null,
      initialKeysOnly: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _cleanType(value, options) {
    Object.entries(value).forEach(([k, v]) => {
      if ( k.startsWith("-=") ) return;
      value[k] = this.model.clean(v, options);
    });
    return value;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  getInitialValue(data) {
    let keys = this.initialKeys;
    const initial = super.getInitialValue(data);
    if ( !keys || !foundry.utils.isEmpty(initial) ) return initial;
    if ( !(keys instanceof Array) ) keys = Object.keys(keys);
    for ( const key of keys ) initial[key] = this._getInitialValueForKey(key);
    return initial;
  }

  /* -------------------------------------------- */

  /**
   * Get the initial value for the provided key.
   * @param {string} key       Key within the object being built.
   * @param {object} [object]  Any existing mapping data.
   * @returns {*}              Initial value based on provided field type.
   */
  _getInitialValueForKey(key, object) {
    const initial = this.model.getInitialValue();
    return this.initialValue?.(key, initial, object) ?? initial;
  }

  /* -------------------------------------------- */

  /** @override */
  _validateType(value, options={}) {
    if ( foundry.utils.getType(value) !== "Object" ) throw new Error("must be an Object");
    const errors = this._validateValues(value, options);
    if ( !foundry.utils.isEmpty(errors) ) {
      const failure = new foundry.data.validation.DataModelValidationFailure();
      failure.elements = Object.entries(errors).map(([id, failure]) => ({ id, failure }));
      throw failure.asError();
    }
  }

  /* -------------------------------------------- */

  /**
   * Validate each value of the object.
   * @param {object} value     The object to validate.
   * @param {object} options   Validation options.
   * @returns {Record<string, Error>}  An object of value-specific errors by key.
   */
  _validateValues(value, options) {
    const errors = {};
    for ( const [k, v] of Object.entries(value) ) {
      if ( k.startsWith("-=") ) continue;
      const error = this.model.validate(v, options);
      if ( error ) errors[k] = error;
    }
    return errors;
  }

  /* -------------------------------------------- */

  /** @override */
  initialize(value, model, options={}) {
    if ( !value ) return value;
    const obj = {};
    const initialKeys = (this.initialKeys instanceof Array) ? this.initialKeys : Object.keys(this.initialKeys ?? {});
    const keys = this.initialKeysOnly ? initialKeys : Object.keys(value);
    for ( const key of keys ) {
      const data = value[key] ?? this._getInitialValueForKey(key, value);
      obj[key] = this.model.initialize(data, model, options);
    }
    return obj;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _getField(path) {
    if ( path.length === 0 ) return this;
    else if ( path.length === 1 ) return this.model;
    path.shift();
    return this.model._getField(path);
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
        return game.system.api.models.actions.actionsTypes[value.type] ?? game.system.api.models.actions.actionsTypes.attack;
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
          name: "Action",
          label: "DAGGERHEART.GENERAL.Action.single",
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
          if(!this.constructor._sheets.has(this.uuid)) {
            const sheet = new this.constructor.metadata.sheetClass(this);
            this.constructor._sheets.set(this.uuid, sheet);
          }
          return this.constructor._sheets.get(this.uuid);
        }

        get inCollection() {
          return foundry.utils.getProperty(this.parent, this.systemPath) instanceof Collection;
        }

        static async create(data, operation={}) {
          const { parent, renderSheet } = operation;
          let { type } = data;
          if(!type || !game.system.api.models.actions.actionsTypes[type]) {
            ({ type } =
                (await foundry.applications.api.DialogV2.input({
                    window: { title: 'Select Action Type' },
                    content: await foundry.applications.handlebars.renderTemplate(
                        'systems/daggerheart/templates/actionTypes/actionType.hbs',
                        { types: CONFIG.DH.ACTIONS.actionTypes }
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
          const newAction = parent.actions.get(action.id);
          if(!newAction) return null;
          if( renderSheet ) newAction.sheet.render({ force: true });
          return newAction;
        }

        async update(updates, options={}) {
          const path = this.inCollection ? `system.${this.systemPath}.${this.id}` : `system.${this.systemPath}`,
            result = await this.item.update({[path]: updates}, options);
          return this.inCollection ? foundry.utils.getProperty(result, `system.${this.systemPath}`).get(this.id) : foundry.utils.getProperty(result, `system.${this.systemPath}`);
        }

        delete() {
          if(!this.inCollection) return this.item;
          const action = foundry.utils.getProperty(this.item, `system.${this.systemPath}`)?.get(this.id);
          if ( !action ) return this.item;
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
              img: this.img,
              name: this.name,
              description: this.description,
              actions: []
          };
          const msg = {
              type: 'abilityUse',
              user: game.user.id,
              system: systemData,
              content: await foundry.applications.handlebars.renderTemplate(
                  'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                  systemData
              )
          };

          cls.create(msg);
        }
    }

    return Action;
}
