import { attributeField } from '../../data/fields/actorField.mjs';

const fields = foundry.data.fields;

export class CharacterCreatorData extends foundry.abstract.DataModel {
    static defineSchema() {
        const createDocumentField = () => new fields.SchemaField({ 
            uuid: new fields.StringField({ nullable: true, initial: null })
        });

        return {
            // Character Options
            class: createDocumentField(),
            subclass: createDocumentField(),
            ancestry: createDocumentField(),
            mixedAncestry: new fields.SchemaField({
                second: createDocumentField(),
                selected: new fields.ArrayField(new fields.StringField())
                // todo: reimplement name override. It was broken before this release anyways
            }, { nullable: true, initial: null }),
            community: createDocumentField(),
            // Char Data
            traits: new fields.SchemaField({
                agility: attributeField('DAGGERHEART.CONFIG.Traits.agility.name'),
                strength: attributeField('DAGGERHEART.CONFIG.Traits.strength.name'),
                finesse: attributeField('DAGGERHEART.CONFIG.Traits.finesse.name'),
                instinct: attributeField('DAGGERHEART.CONFIG.Traits.instinct.name'),
                presence: attributeField('DAGGERHEART.CONFIG.Traits.presence.name'),
                knowledge: attributeField('DAGGERHEART.CONFIG.Traits.knowledge.name')
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({ blank: true, initial: '' }),
                    value: new fields.NumberField({ initial: 2, integer: true }),
                    core: new fields.BooleanField({ initial: true })
                })
            ),
            domainCards: new fields.TypedObjectField(
                createDocumentField()
            ),
            equipment: new fields.SchemaField({
                armor: createDocumentField(),
                primaryWeapon: createDocumentField(),
                secondaryWeapon: createDocumentField(),
                inventory: new fields.SchemaField({
                    take: createDocumentField(),
                    choiceA: createDocumentField(),
                    choiceB: createDocumentField()
                })
            }),
            visibility: new fields.NumberField({ initial: 1 })
        }
    }

    /** Replaces all prepared data with actual loaded objects asynchronously */
    async load() {
        this.class = await fromUuid(this.class.uuid) ?? { uuid: null };
        this.subclass = await fromUuid(this.subclass.uuid) ?? { uuid: null };
        this.ancestry = await fromUuid(this.ancestry.uuid) ?? { uuid: null };
        if (this.mixedAncestry) {
            this.mixedAncestry.second = await fromUuid(this.mixedAncestry.second.uuid) ?? { uuid: null };
        }
        this.community = await fromUuid(this.community.uuid) ?? { uuid: null };
        for (const [key, value] of Object.entries(this.domainCards)) {
            this.domainCards[key] = await fromUuid(value.uuid) ?? { uuid: null }
        }
        this.equipment.armor = await fromUuid(this.equipment.armor.uuid) ?? { uuid: null };
        this.equipment.primaryWeapon = await fromUuid(this.equipment.primaryWeapon.uuid) ?? { uuid: null };
        this.equipment.secondaryWeapon = await fromUuid(this.equipment.secondaryWeapon.uuid) ?? { uuid: null };
        this.equipment.inventory.take = await fromUuid(this.equipment.inventory.take.uuid) ?? { uuid: null };
        this.equipment.inventory.choiceA = await fromUuid(this.equipment.inventory.choiceA.uuid) ?? { uuid: null };
        this.equipment.inventory.choiceB = await fromUuid(this.equipment.inventory.choiceB.uuid) ?? { uuid: null };
    }

    async createAncestryItem() {
        const primaryAncestry = await fromUuid(this.ancestry.uuid);
        const secondaryAncestry = await fromUuid(this.mixedAncestry?.second.uuid);
        const object = primaryAncestry?.toObject();
        
        if (!secondaryAncestry || !primaryAncestry) {
            return object ?? null;
        }

        // todo: check validity of "selected fields"

        return {
            name: `${primaryAncestry.name}/${secondaryAncestry.name}`,
            type: 'ancestry',
            uuid: primaryAncestry.uuid, // used to figure out compendiumSource/duplicateSource
            system: {
                ...object.system,
                features: [
                    { type: 'primary', item: this.mixedAncestry.selected[0] },
                    { type: 'secondary', item: this.mixedAncestry.selected[1] }
                ]
            }
        };
    }
}