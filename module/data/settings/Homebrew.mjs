import { defaultRestOptions } from '../../config/generalConfig.mjs';

export default class DhHomebrew extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Settings.Homebrew']; // Doesn't work for some reason

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            maxFear: new fields.NumberField({
                required: true,
                integer: true,
                min: 0,
                initial: 12,
                label: 'DAGGERHEART.Settings.Homebrew.FIELDS.maxFear.label'
            }),
            traitArray: new fields.ArrayField(new fields.NumberField({ required: true, integer: true }), {
                initial: () => [2, 1, 1, 0, 0, -1]
            }),
            currency: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.Settings.Homebrew.Currency.enabled'
                }),
                title: new fields.StringField({
                    required: true,
                    initial: 'Gold',
                    label: 'DAGGERHEART.Settings.Homebrew.Currency.currencyName'
                }),
                coins: new fields.StringField({
                    required: true,
                    initial: 'Coins',
                    label: 'DAGGERHEART.Settings.Homebrew.Currency.coinName'
                }),
                handfulls: new fields.StringField({
                    required: true,
                    initial: 'Handfulls',
                    label: 'DAGGERHEART.Settings.Homebrew.Currency.handfullName'
                }),
                bags: new fields.StringField({
                    required: true,
                    initial: 'Bags',
                    label: 'DAGGERHEART.Settings.Homebrew.Currency.bagName'
                }),
                chests: new fields.StringField({
                    required: true,
                    initial: 'Chests',
                    label: 'DAGGERHEART.Settings.Homebrew.Currency.chestName'
                })
            }),
            restMoves: new fields.SchemaField({
                longRest: new fields.SchemaField({
                    nrChoices: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
                    moves: new fields.TypedObjectField(
                        new fields.SchemaField({
                            name: new fields.StringField({ required: true }),
                            img: new fields.FilePathField({
                                initial: 'icons/magic/life/cross-worn-green.webp',
                                categories: ['IMAGE'],
                                base64: false
                            }),
                            description: new fields.HTMLField(),
                            actions: new fields.ArrayField(new fields.ObjectField())
                        }),
                        { initial: defaultRestOptions.longRest() }
                    )
                }),
                shortRest: new fields.SchemaField({
                    nrChoices: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
                    moves: new fields.TypedObjectField(
                        new fields.SchemaField({
                            name: new fields.StringField({ required: true }),
                            img: new fields.FilePathField({
                                initial: 'icons/magic/life/cross-worn-green.webp',
                                categories: ['IMAGE'],
                                base64: false
                            }),
                            description: new fields.HTMLField(),
                            actions: new fields.ArrayField(new fields.ObjectField())
                        }),
                        { initial: defaultRestOptions.shortRest() }
                    )
                })
            })
        };
    }
}
