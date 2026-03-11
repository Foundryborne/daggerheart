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

const restMoveField = () =>
    new foundry.data.fields.SchemaField({
        name: new foundry.data.fields.StringField({ required: true }),
        icon: new foundry.data.fields.StringField({ required: true }),
        img: new foundry.data.fields.FilePathField({
            initial: 'icons/magic/life/cross-worn-green.webp',
            categories: ['IMAGE'],
            base64: false
        }),
        description: new foundry.data.fields.HTMLField(),
        actions: new ActionsField(),
        effects: new foundry.data.fields.ArrayField(new foundry.data.fields.ObjectField())
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
            maxHope: new fields.NumberField({
                required: true,
                integer: true,
                min: 0,
                initial: 6,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxHope.label'
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
            tokenSizes: new fields.SchemaField({
                tiny: new fields.NumberField({
                    integer: false,
                    initial: 0.5,
                    label: 'DAGGERHEART.CONFIG.TokenSize.tiny'
                }),
                small: new fields.NumberField({
                    integer: false,
                    initial: 0.8,
                    label: 'DAGGERHEART.CONFIG.TokenSize.small'
                }),
                medium: new fields.NumberField({
                    integer: false,
                    initial: 1,
                    label: 'DAGGERHEART.CONFIG.TokenSize.medium'
                }),
                large: new fields.NumberField({
                    integer: false,
                    initial: 2,
                    label: 'DAGGERHEART.CONFIG.TokenSize.large'
                }),
                huge: new fields.NumberField({
                    integer: false,
                    initial: 3,
                    label: 'DAGGERHEART.CONFIG.TokenSize.huge'
                }),
                gargantuan: new fields.NumberField({
                    integer: false,
                    initial: 4,
                    label: 'DAGGERHEART.CONFIG.TokenSize.gargantuan'
                })
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
                    moves: new fields.TypedObjectField(restMoveField(), { initial: defaultRestOptions.longRest() })
                }),
                shortRest: new fields.SchemaField({
                    nrChoices: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
                    moves: new fields.TypedObjectField(restMoveField(), { initial: defaultRestOptions.shortRest() })
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
            resources: new fields.TypedObjectField(
                new fields.SchemaField({
                    resources: new fields.TypedObjectField(new fields.EmbeddedDataField(Resource))
                }),
                {
                    initial: {
                        character: { resources: {} }
                    }
                }
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

    /** Invoked by the setting when data changes */
    handleChange() {
        if (this.maxFear) {
            if (ui.resources) ui.resources.render({ force: true });
        }

        this.refreshConfig();
        this.#resetActors();
    }

    /** Update config values based on homebrew data. Make sure the references don't change */
    refreshConfig() {
        for (const [actorType, actorData] of Object.entries(this.resources)) {
            const config = CONFIG.DH.RESOURCE[actorType];
            for (const key of Object.keys(config.all)) {
                delete config.all[key];
            }
            Object.assign(config.all, {
                ...Object.entries(actorData.resources).reduce((result, [key, value]) => {
                    result[key] = value.toObject();
                    result[key].id = key;
                    return result;
                }, {}),
                ...config.custom,
                ...config.base,
            });
        }
    }

    /**
     * Triggers a reset and non-forced re-render on all given actors (if given)
     * or all world actors and actors in all scenes to show immediate results for a changed setting.
     */
    #resetActors() {
        const actors = new Set(
            [
                game.actors.contents,
                game.scenes.contents.flatMap(s => s.tokens.contents).flatMap(t => t.actor ?? [])
            ].flat()
        );
        for (const actor of actors) {
            for (const app of Object.values(actor.apps)) {
                for (const element of app.element?.querySelectorAll('prose-mirror.active')) {
                    element.open = false; // This triggers a save
                }
            }

            actor.reset();
            actor.render();
        }
    }
}

export class Resource extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            initial: new fields.NumberField({
                required: true,
                integer: true,
                initial: 0,
                min: 0,
                label: 'DAGGERHEART.GENERAL.initial'
            }),
            max: new fields.NumberField({
                nullable: true,
                initial: null,
                min: 0,
                label: 'DAGGERHEART.GENERAL.max'
            }),
            label: new fields.StringField({ label: 'DAGGERHEART.GENERAL.label' }),
            images: new fields.SchemaField({
                full: imageIconField('fa solid fa-circle'),
                empty: imageIconField('fa-regular fa-circle')
            })
        };
    }

    static getDefaultResourceData = label => {
        const images = Resource.schema.fields.images.getInitialValue();
        return {
            initial: 0,
            max: 0,
            label: label ?? '',
            images
        };
    };

    static getDefaultImageData = imageKey => {
        return Resource.schema.fields.images.fields[imageKey].getInitialValue();
    };
}

const imageIconField = defaultValue =>
    new foundry.data.fields.SchemaField(
        {
            value: new foundry.data.fields.StringField({
                initial: defaultValue,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.resources.resources.value.label'
            }),
            isIcon: new foundry.data.fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.resources.resources.isIcon.label'
            }),
            noColorFilter: new foundry.data.fields.BooleanField({
                required: true,
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.resources.resources.noColorFilter.label'
            })
        },
        { required: true }
    );
