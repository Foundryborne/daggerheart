import { getTier } from '../helpers/utils.mjs';
import featuresSchema from './interface/featuresSchema.mjs';
import DaggerheartFeature from './feature.mjs';

export default class DhpSubclass extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({}),
            spellcastingTrait: new fields.StringField({
                choices: SYSTEM.ACTOR.abilities,
                integer: false,
                nullable: true,
                initial: null
            }),
            foundationFeature: new fields.SchemaField({
                description: new fields.HTMLField({}),
                abilities: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                )
            }),
            specializationFeature: new fields.SchemaField({
                unlocked: new fields.BooleanField({ initial: false }),
                tier: new fields.NumberField({ initial: null, nullable: true, integer: true }),
                description: new fields.HTMLField({}),
                abilities: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                )
            }),
            masteryFeature: new fields.SchemaField({
                unlocked: new fields.BooleanField({ initial: false }),
                tier: new fields.NumberField({ initial: null, nullable: true, integer: true }),
                description: new fields.HTMLField({}),
                abilities: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                )
            }),
            multiclass: new fields.NumberField({ initial: null, nullable: true, integer: true })
        };
    }

    get multiclassTier() {
        return getTier(this.multiclass);
    }
}
