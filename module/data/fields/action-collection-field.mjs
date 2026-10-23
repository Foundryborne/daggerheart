import { ActionField } from './actionField.mjs';

/**
 * Specialized collection type for stored actions.
 * @param {DataModel} model     The parent DataModel to which this ActionCollection belongs.
 * @param {Action[]} entries  The actions to store.
 */
export class ActionCollection extends Collection {
    constructor(model, entries) {
        super();
        for (const [key, value] of entries) {
            if (!(value instanceof game.system.api.models.actions.actionsTypes.base)) continue;
            this.set(key, value);
        }
    }

    /* -------------------------------------------- */
    /*  Properties                                  */
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

export class ActionCollectionField extends foundry.data.fields.TypedObjectField {
    constructor(options) {
        super(new ActionField(), options);
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    initialize(value, model, options) {
        const actions = Object.entries(super.initialize(value, model, options));
        return new ActionCollection(model, actions);
    }

    /** @inheritdoc */
    clean(value, options, state) {
        // Before any migrations and such occurs, convert collections to objects
        if (value instanceof Collection) {
            value = value.entries().reduce((r, [k, v]) => {
                r[k] = v;
                return r;
            }, {});
        }
        return super.clean(value, this.options, state);
    }

    /** @inheritdoc */
    _cleanType(value, options, state) {
        value = super._cleanType(value, options, state);
        // Ensure ids match. If ids do not match, this causes issues in things like the action config's resync
        // _id is considered more accurate, due to validation rules
        if (value && typeof value === 'object') {
            for (const [key, objValue] of Object.entries(value)) {
                if (objValue._id && key !== objValue._id) {
                    delete value[key];
                    value[objValue._id] = objValue;
                }
            }
        }
        return value;
    }
}
