const fields = foundry.data.fields;

const attributeField = label =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, label }),
        tierMarked: new fields.BooleanField({ initial: false })
    });

const resourceField = (max = 0, label, reverse = false) =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, label }),
        max: new fields.NumberField({ initial: max, integer: true }),
        isReversed: new fields.BooleanField({ initial: reverse })
    });

const stressDamageReductionRule = localizationPath =>
    new fields.SchemaField({
        enabled: new fields.BooleanField({ required: true, initial: false }),
        cost: new fields.NumberField({
            integer: true,
            label: `${localizationPath}.label`,
            hint: `${localizationPath}.hint`
        })
    });

const bonusField = label =>
    new fields.SchemaField({
        bonus: new fields.NumberField({ integer: true, initial: 0, label: `${game.i18n.localize(label)} Value` }),
        dice: new fields.ArrayField(
            new fields.StringField(),
            { label: `${game.i18n.localize(label)} Dice` }
        )
    });

export { attributeField, resourceField, stressDamageReductionRule, bonusField };
