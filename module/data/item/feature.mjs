import BaseDataItem from './base.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHFeature extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.feature',
            type: 'feature',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            type: new fields.StringField({ choices: CONFIG.DH.ITEM.featureTypes, nullable: true, initial: null }),
            originId: new fields.StringField({ nullable: true, initial: null }),
            identifier: new fields.StringField(),
            actions: new fields.ArrayField(new ActionField())
        };
    }
}
