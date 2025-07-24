import ForeignDocumentUUIDField from './foreignDocumentUUIDField.mjs';

export default class ItemLinkFields extends foundry.data.fields.ArrayField {
    constructor(options, context) {
        super(new ItemLinkField(), options, context);
    }
}

class ItemLinkField extends foundry.data.fields.SchemaField {
    constructor(context) {
        super(
            {
                type: new foundry.data.fields.StringField({ choices: CONFIG.DH.ITEM.featureSubTypes, nullable: true }),
                item: new ForeignDocumentUUIDField({ type: 'Item' })
            },
            context
        );
    }
}
