export default class DhCampaignFrames extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            frames: new fields.TypedObjectField(new fields.EmbeddedDataField(DhCampaignFrame))
        };
    }

    register(frames) {
        this.updateSource({ frames });
    }
}

class DhCampaignFrame extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            name: new fields.StringField({ required: true }),
            img: new fields.FilePathField({ initial: 'icons/svg/mountain.svg', categories: ['IMAGE'], base64: false }),
            complexityRating: new fields.NumberField({ required: true, integer: true }),
            pitch: new fields.HTMLField(),
            toneAndFeel: new fields.StringField(),
            themes: new fields.StringField(),
            touchstones: new fields.StringField()
        };
    }
}
