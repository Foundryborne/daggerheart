export default class IterableTypedObjectField extends foundry.data.fields.TypedObjectField {
    constructor(model, options = { collectionClass: foundry.utils.Collection }, context = {}) {
        super(new foundry.data.fields.EmbeddedDataField(model), options, context);
        this.#elementClass = model;
    }

    #elementClass;

    /** Initializes an object with an iterator, where foundry.utils.getType() returns "Object" */
    initialize(values) {
        const object = {};
        for (const [key, value] of Object.entries(values)) {
            object[key] = new this.#elementClass(value);
        }
        object[Symbol.iterator] = function* () {
            for (const value of Object.values(this)) {
                yield value;
            }
        }
        Object.defineProperties(object, {
            map: {
                value: function (func) {
                    return Array.from(this, func);
                }
            }
        });
        return object;
    }
}
