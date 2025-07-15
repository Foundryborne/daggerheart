const fields = foundry.data.fields;

const attributeField = () =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true }),
        tierMarked: new fields.BooleanField({ initial: false })
    });

const resourceField = (max = 0, reverse = false) =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true }),
        max: new fields.NumberField({ initial: max, integer: true }),
        isReversed: new fields.BooleanField({ initial: reverse })
    });

const stressDamageReductionRule = () =>
    new fields.SchemaField({
        enabled: new fields.BooleanField({ required: true, initial: false }),
        cost: new fields.NumberField({ integer: true })
    });

const bonusField = () => 
    new fields.SchemaField({
        bonus: new fields.NumberField({ integer: true, initial: 0 }),
        dice: new fields.ArrayField(new fields.StringField())
    })

export { attributeField, resourceField, stressDamageReductionRule, bonusField };