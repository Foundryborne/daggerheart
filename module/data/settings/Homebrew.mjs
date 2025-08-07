import { defaultRestOptions } from '../../config/generalConfig.mjs';
import { ActionsField } from '../fields/actionField.mjs';

export default class DhHomebrew extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            maxFear: new fields.NumberField({
                required: true,
                integer: true,
                min: 0,
                initial: 12,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxFear.label'
            }),
            maxLoadout: new fields.NumberField({
                required: true,
                integer: true,
                min: 0,
                initial: 5,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxLoadout.label'
            }),
            maxDomains: new fields.NumberField({
                required: true,
                integer: true,
                min: 1,
                initial: 2,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxDomains.label'
            }),
            traitArray: new fields.ArrayField(new fields.NumberField({ required: true, integer: true }), {
                initial: () => [2, 1, 1, 0, 0, -1]
            }),
            currency: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.enabled'
                }),
                title: new fields.StringField({
                    required: true,
                    initial: 'Gold',
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.currencyName'
                }),
                coins: new fields.StringField({
                    required: true,
                    initial: 'Coins',
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.coinName'
                }),
                handfuls: new fields.StringField({
                    required: true,
                    initial: 'Handfuls',
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.handfulName'
                }),
                bags: new fields.StringField({
                    required: true,
                    initial: 'Bags',
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.bagName'
                }),
                chests: new fields.StringField({
                    required: true,
                    initial: 'Chests',
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.chestName'
                })
            }),
            restMoves: new fields.SchemaField({
                longRest: new fields.SchemaField({
                    nrChoices: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
                    moves: new fields.TypedObjectField(
                        new fields.SchemaField({
                            name: new fields.StringField({ required: true }),
                            icon: new fields.StringField({ required: true }),
                            img: new fields.FilePathField({
                                initial: 'icons/magic/life/cross-worn-green.webp',
                                categories: ['IMAGE'],
                                base64: false
                            }),
                            description: new fields.HTMLField(),
                            actions: new ActionsField()
                        }),
                        { initial: defaultRestOptions.longRest() }
                    )
                }),
                shortRest: new fields.SchemaField({
                    nrChoices: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
                    moves: new fields.TypedObjectField(
                        new fields.SchemaField({
                            name: new fields.StringField({ required: true }),
                            icon: new fields.StringField({ required: true }),
                            img: new fields.FilePathField({
                                initial: 'icons/magic/life/cross-worn-green.webp',
                                categories: ['IMAGE'],
                                base64: false
                            }),
                            description: new fields.HTMLField(),
                            actions: new ActionsField()
                        }),
                        { initial: defaultRestOptions.shortRest() }
                    )
                })
            }),
            domains: new fields.TypedObjectField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    label: new fields.StringField({ required: true, initial: '', label: 'DAGGERHEART.GENERAL.label' }),
                    src: new fields.FilePathField({
                        categories: ['IMAGE'],
                        base64: false,
                        label: 'Image'
                    }),
                    description: new fields.HTMLField()
                })
            )
        };
    }
}
