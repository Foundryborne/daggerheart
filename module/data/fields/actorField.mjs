const fields = foundry.data.fields;

const attributeField = label =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, label }),
        tierMarked: new fields.BooleanField({ initial: false })
    });

const resourceField = (max = 0, initial = 0, label, reverse = false, maxLabel) =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: initial, min: 0, integer: true, label }),
        max: new fields.NumberField({
            initial: max,
            integer: true,
            label:
                maxLabel ?? game.i18n.format('DAGGERHEART.GENERAL.maxWithThing', { thing: game.i18n.localize(label) })
        }),
        isReversed: new fields.BooleanField({ initial: reverse })
    });

const stressDamageReductionRule = localizationPath =>
    new fields.SchemaField({
        cost: new fields.NumberField({
            integer: true,
            label: `${localizationPath}.label`,
            hint: `${localizationPath}.hint`
        })
    });

const bonusField = label =>
    new fields.SchemaField({
        bonus: new fields.NumberField({ integer: true, initial: 0, label: `${game.i18n.localize(label)} Value` }),
        dice: new fields.ArrayField(new fields.StringField(), { label: `${game.i18n.localize(label)} Dice` })
    });

export { attributeField, resourceField, stressDamageReductionRule, bonusField };
