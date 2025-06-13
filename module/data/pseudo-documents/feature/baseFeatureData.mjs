import PseudoDocument from '../base/pseudoDocument.mjs';

export default class BaseFeatureData extends PseudoDocument {
    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(
            super.metadata,
            {
                name: 'feature',
                embedded: {},
                //sheetClass: null //TODO: define feature-sheet
            },
            { inplace: false }
        );
    }

    static defineSchema() {
        const { fields } = foundry.data;
        const schema = super.defineSchema();
        return Object.assign(schema, {
            subtype: new fields.StringField({ initial: 'test' })
        });
    }
}
