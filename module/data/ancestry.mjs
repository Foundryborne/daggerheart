import featuresSchema from './interface/featuresSchema.mjs';

export default class DhpAncestry extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({}),
            abilities: featuresSchema()
        };
    }
}
