import { defaultRestOptions } from '../../config/generalConfig.mjs';
import { ActionsField } from '../fields/actionField.mjs';

const currencyField = (initial, label, icon) =>
    new foundry.data.fields.SchemaField({
        enabled: new foundry.data.fields.BooleanField({ required: true, initial: true }),
        label: new foundry.data.fields.StringField({
            required: true,
            initial,
            label
        }),
        icon: new foundry.data.fields.StringField({ required: true, nullable: false, blank: true, initial: icon })
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
                coins: currencyField(
                    'Coins',
                    'DAGGERHEART.SETTINGS.Homebrew.currency.coinName',
                    'fa-solid fa-coin-front'
                ),
                handfuls: currencyField(
                    'Handfuls',
                    'DAGGERHEART.SETTINGS.Homebrew.currency.handfulName',
                    'fa-solid fa-coins'
                ),
                bags: currencyField('Bags', 'DAGGERHEART.SETTINGS.Homebrew.currency.bagName', 'fa-solid fa-sack'),
                chests: currencyField(
                    'Chests',
                    'DAGGERHEART.SETTINGS.Homebrew.currency.chestName',
                    'fa-solid fa-treasure-chest'
                )
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
        for (const type of ['coins', 'handfuls', 'bags', 'chests']) {
            const initial = this.schema.fields.currency.fields[type].getInitialValue();
            source.currency[type] = foundry.utils.mergeObject(initial, source.currency[type], { inplace: false });
        }
        return source;
    }
}
