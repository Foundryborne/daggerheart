import { getTier } from '../../helpers/utils.mjs';
import BaseDataItem from './base.mjs';

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
                //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    uuid: new fields.StringField({})
                })
            ),
            evasion: new fields.NumberField({ initial: 0, integer: true }),
            features: new fields.ArrayField(
                //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    uuid: new fields.StringField({})
                })
            ),

            subclasses: new fields.ArrayField(
                //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    uuid: new fields.StringField({})
                })
            ),
            inventory: new fields.SchemaField({
                take: new fields.ArrayField(
                    //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                ),
                choiceA: new fields.ArrayField(
                    //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                ),
                choiceB: new fields.ArrayField(
                    //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                ),
                extra: new fields.SchemaField(
                    //TODO: use DocumentUUIDField, DocumentIdField or create LocalDocumentField
                    {
                        title: new fields.StringField({}),
                        description: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                )
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
                suggestedPrimaryWeapon: new fields.SchemaField(
                    {
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                ),
                suggestedSecondaryWeapon: new fields.SchemaField(
                    {
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                ),
                suggestedArmor: new fields.SchemaField(
                    {
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                ),

                //FIXME this not will work
                backgroundQuestions: new fields.ArrayField(new fields.StringField({}), { initial: ['', '', ''] }),
                
                //FIXME this not will work
                connections: new fields.ArrayField(new fields.StringField({}), { initial: ['', '', ''] })
            }),
            multiclass: new fields.NumberField({ initial: null, nullable: true, integer: true }),
        };
    }

    get multiclassTier() {
        return getTier(this.multiclass, true);
    }

    /** @inheritDoc */
    prepareBaseData() {
        super.prepareBaseData()
        this.domains = this.domains.map(k => SYSTEM.DOMAIN.domains[k]);
    }
}
