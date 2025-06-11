import PseudoDocument from '../base/pseudoDocument.mjs';

export default class BaseFeatureData extends PseudoDocument {
    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(
            super.metadata,
            {
                name: 'feature',
                label: 'DAGGERHEART.Feature.Label',
                embedded: {},
                sheetClass: null //TODO: define feature-sheet
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
