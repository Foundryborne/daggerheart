import BasePseudoDocument from './base.mjs';
import SheetManagementMixin from './sheetManagementMixin.mjs';

/** @extends BasePseudoDocument */
export default class PseudoDocument extends SheetManagementMixin(BasePseudoDocument) {
    static get TYPES() {
        const { types } = CONFIG.daggerheart.pseudoDocuments[this.metadata.name];
        const typeEntries = Object.entries(types).map(([key, { documentClass }]) => [key, documentClass]);
        return (this._TYPES ??= Object.freeze(Object.fromEntries(typeEntries)));
    }

    static _TYPES;

    /**
     * The type of this shape.
     * @type {string}
     */
    static TYPE = '';

    /* -------------------------------------------- */

    static getTypesChoices(validTypes) {
        const { types } = CONFIG.daggerheart.pseudoDocuments[model.metadata.name];
        const typeEntries = Object.entries(types)
            .map(([key, { label }]) => [key, label])
            .filter(([key]) => !validTypes || validTypes.includes(key));

        return Object.entries(typeEntries);
    }

    /* -------------------------------------------- */

    /** @override */
    static defineSchema() {
        const { fields } = foundry.data;

        return Object.assign(super.defineSchema(), {
            type: new fields.StringField({
                required: true,
                blank: false,
                initial: this.TYPE,
                validate: value => value === this.TYPE,
                validationError: `must be equal to "${this.TYPE}"`
            })
        });
    }

    /** @inheritdoc */
    static async create(data = {}, { parent, ...operation } = {}) {
        data = foundry.utils.deepClone(data);
        if (!data.type) data.type = Object.keys(this.TYPES)[0];
        if (!(data.type in this.TYPES)) {
            throw new Error(
                `The '${data.type}' type is not a valid type for a '${this.metadata.documentName}' pseudo-document!`
            );
        }
        return super.create(data, { parent, ...operation });
    }
}
