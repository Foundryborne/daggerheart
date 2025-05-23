const fields = foundry.data.fields;

const featuresSchema = () =>
    new fields.ArrayField(
        new fields.SchemaField({
            name: new fields.StringField({}),
            img: new fields.StringField({}),
            uuid: new fields.StringField({}),
            subclassLevel: new fields.StringField({})
        })
    );

export default featuresSchema;
