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
            primaryAncestry: createDocumentField(),
            secondaryAncestry: createDocumentField(),
            mixedAncestry: new fields.BooleanField({ initial: false }),
            ancestryName: new fields.SchemaField({
                primary: new fields.StringField(),
                secondary: new fields.StringField(),
                overwrite: new fields.BooleanField()
            }),
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
        this.primaryAncestry = await fromUuid(this.primaryAncestry.uuid) ?? { uuid: null };
        this.secondaryAncestry = await fromUuid(this.secondaryAncestry.uuid) ?? { uuid: null };
        this.community = await fromUuid(this.community.uuid) ?? { uuid: null };
        for (const [key, value] of Object.entries(this.domainCards)) {
            this.domainCards[key] = await fromUuid(value.uuid) ?? { uuid: null }
        }
        this.equipment.armor = await fromUuid(this.equipment.armor.uuid) ?? { uuid: null };
        this.equipment.primaryWeapon = await fromUuid(this.equipment.primaryWeapon.uuid) ?? { uuid: null };
        this.equipment.secondaryWeapon = await fromUuid(this.equipment.secondaryWeapon.uuid) ?? { uuid: null };
        this.equipment.inventory.take = await fromUuid(this.equipment.inventory.take) ?? { uuid: null };
        this.equipment.inventory.choiceA = await fromUuid(this.equipment.inventory.choiceA) ?? { uuid: null };
        this.equipment.inventory.choiceB = await fromUuid(this.equipment.inventory.choiceB) ?? { uuid: null };
    }
}