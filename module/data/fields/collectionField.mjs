export default class CollectionField extends foundry.data.fields.TypedObjectField {
    constructor(model, options = { collectionClass: foundry.utils.Collection }, context = {}) {
        super(new foundry.data.fields.EmbeddedDataField(model), options, context);
        this.#elementClass = model;
        this.#collectionClass = options.collectionClass;
    }

    /**
     * The collection class
     */
    #collectionClass;

    /**
     * The collection element class.
     */
    #elementClass;

    initialize(value, model, _options = {}) {
        console.log(model);
        const collection = new this.#collectionClass(
            Object.entries(value).map(([key, value]) => [key, new this.#elementClass(value)])
        );
        return collection;
    }
}
