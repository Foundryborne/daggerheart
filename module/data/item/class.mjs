import { getTier } from '../../helpers/utils.mjs';
import BaseDataItem from './base.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';

export default class DHClass extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: "TYPES.Item.class",
            type: "class",
            hasDescription: true,
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            domains: new fields.ArrayField(new fields.StringField(), { max: 2 }),

            classItems: new fields.ArrayField(
                new ForeignDocumentUUIDField({ type:"Item" }),
            ),
            evasion: new fields.NumberField({ initial: 0, integer: true }),
            features: new fields.ArrayField(
                new ForeignDocumentUUIDField({ type:"Item" }),
            ),

            subclasses: new fields.ArrayField(
                new ForeignDocumentUUIDField({ type:"Item", required: false, nullable: true, initial: undefined}),
            ),
            inventory: new fields.SchemaField({
                take: new fields.ArrayField(
                     new ForeignDocumentUUIDField({ type:"Item", required: false, nullable: true, initial: undefined}),
                ),
                choiceA: new fields.ArrayField(
                     new ForeignDocumentUUIDField({ type:"Item", required: false, nullable: true, initial: undefined}),
                ),
                choiceB: new fields.ArrayField(
                     new ForeignDocumentUUIDField({ type:"Item", required: false, nullable: true, initial: undefined}),
                ),
            }),
            characterGuide: new fields.SchemaField({
                suggestedTraits: new fields.SchemaField({
                    agility: new fields.NumberField({ initial: 0, integer: true }),
                    strength: new fields.NumberField({ initial: 0, integer: true }),
                    finesse: new fields.NumberField({ initial: 0, integer: true }),
                    instinct: new fields.NumberField({ initial: 0, integer: true }),
                    presence: new fields.NumberField({ initial: 0, integer: true }),
                    knowledge: new fields.NumberField({ initial: 0, integer: true })
                }),
                suggestedPrimaryWeapon: new ForeignDocumentUUIDField({ type:"Item" }),
                suggestedSecondaryWeapon: new ForeignDocumentUUIDField({ type:"Item" }),
                suggestedArmor: new ForeignDocumentUUIDField({ type:"Item" }),
            }),
            multiclass: new fields.NumberField({ initial: null, nullable: true, integer: true }),
        };
    }

    get multiclassTier() { 
        return getTier(this.multiclass, true);
    }
}
