import { defaultRestOptions } from '../../config/generalConfig.mjs';
import { ActionsField } from '../fields/actionField.mjs';

const currencyField = (initial, label) =>
    new foundry.data.fields.SchemaField({
        enabled: new foundry.data.fields.BooleanField({ required: true, initial: true }),
        label: new foundry.data.fields.StringField({
            required: true,
            initial,
            label
        })
    });

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
                title: new fields.StringField({
                    required: true,
                    initial: 'Gold',
                    label: 'DAGGERHEART.SETTINGS.Homebrew.currency.currencyName'
                }),
                coins: currencyField('Coins', 'DAGGERHEART.SETTINGS.Homebrew.currency.coinName'),
                handfuls: currencyField('Handfuls', 'DAGGERHEART.SETTINGS.Homebrew.currency.handfulName'),
                bags: currencyField('Bags', 'DAGGERHEART.SETTINGS.Homebrew.currency.bagName'),
                chests: currencyField('Chests', 'DAGGERHEART.SETTINGS.Homebrew.currency.chestName')
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
            ),
            adversaryTypes: new fields.TypedObjectField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    label: new fields.StringField({ required: true, label: 'DAGGERHEART.GENERAL.label' }),
                    description: new fields.StringField()
                })
            ),
            itemFeatures: new fields.SchemaField({
                weaponFeatures: new fields.TypedObjectField(
                    new fields.SchemaField({
                        name: new fields.StringField({ required: true }),
                        img: new fields.FilePathField({
                            initial: 'icons/magic/life/cross-worn-green.webp',
                            categories: ['IMAGE'],
                            base64: false
                        }),
                        description: new fields.HTMLField(),
                        actions: new ActionsField(),
                        effects: new fields.ArrayField(new fields.ObjectField())
                    })
                ),
                armorFeatures: new fields.TypedObjectField(
                    new fields.SchemaField({
                        name: new fields.StringField({ required: true }),
                        img: new fields.FilePathField({
                            initial: 'icons/magic/life/cross-worn-green.webp',
                            categories: ['IMAGE'],
                            base64: false
                        }),
                        description: new fields.HTMLField(),
                        actions: new ActionsField(),
                        effects: new fields.ArrayField(new fields.ObjectField())
                    })
                )
            })
        };
    }

    /** @inheritDoc */
    _initializeSource(source, options = {}) {
        source = super._initializeSource(source, options);
        source.currency.coins = {
            enabled: source.currency.coins.enabled ?? true,
            label: source.currency.coins.label || source.currency.coins
        };
        source.currency.handfuls = {
            enabled: source.currency.handfuls.enabled ?? true,
            label: source.currency.handfuls.label || source.currency.handfuls
        };
        source.currency.bags = {
            enabled: source.currency.bags.enabled ?? true,
            label: source.currency.bags.label || source.currency.bags
        };
        source.currency.chests = {
            enabled: source.currency.chests.enabled ?? true,
            label: source.currency.chests.label || source.currency.chests
        };
        return source;
    }
}
