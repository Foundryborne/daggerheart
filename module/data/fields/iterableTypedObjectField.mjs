export default class IterableTypedObjectField extends foundry.data.fields.TypedObjectField {
    constructor(model, options = { collectionClass: foundry.utils.Collection }, context = {}) {
        super(new foundry.data.fields.EmbeddedDataField(model), options, context);
        this.#elementClass = model;
    }

    #elementClass;

    initialize(value) {
        return new IterableObject(value, this.#elementClass);
    }
}

class IterableObject {
    constructor(values, elementClass) {
        for (const [key, value] of Object.entries(values)) {
            this[key] = new elementClass(value);
        }
    }

    *[Symbol.iterator]() {
        for (const value of Object.values(this)) {
            yield value;
        }
    }

    map(func) {
        return Array.from(this, func);
    }
}
