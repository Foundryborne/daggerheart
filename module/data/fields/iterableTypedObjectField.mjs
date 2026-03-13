export default class IterableTypedObjectField extends foundry.data.fields.TypedObjectField {
    constructor(model, options = { collectionClass: foundry.utils.Collection }, context = {}) {
        super(new foundry.data.fields.EmbeddedDataField(model), options, context);
        this.#elementClass = model;
    }

    #elementClass;

    /** Initializes an object with an iterator. This modifies the prototype instead of */
    initialize(values) {
        const object = Object.create(IterableObjectPrototype);
        for (const [key, value] of Object.entries(values)) {
            object[key] = new this.#elementClass(value);
        }
        return object;
    }
}

/** 
 * The prototype of an iterable object. 
 * This allows the functionality of a class but also allows foundry.utils.getType() to return "Object" instead of "Unknown".
 */
const IterableObjectPrototype = {
    [Symbol.iterator]: function*() {
        for (const value of Object.values(this)) {
            yield value;
        }
    },
    map: function (func) {
        return Array.from(this, func);
    }
};