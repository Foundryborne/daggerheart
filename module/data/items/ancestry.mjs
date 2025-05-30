import featuresSchema from '../interface/featuresSchema.mjs';

export default class DHAncestry extends foundry.abstract.TypeDataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({}),
            abilities: featuresSchema()
        };
    }
}
