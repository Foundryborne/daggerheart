import { updateActorTokens } from '../../helpers/utils.mjs';

export default class BeastformEffect extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            isBeastform: new fields.BooleanField({ initial: false }),
            characterTokenData: new fields.SchemaField({
                tokenImg: new fields.FilePathField({
                    categories: ['IMAGE'],
                    base64: false,
                    nullable: true
                }),
                tokenSize: new fields.SchemaField({
                    height: new fields.NumberField({ integer: true, nullable: true }),
                    width: new fields.NumberField({ integer: true, nullable: true })
                })
            }),
            advantageOn: new fields.ArrayField(new fields.StringField()),
            featureIds: new fields.ArrayField(new fields.StringField()),
            effectIds: new fields.ArrayField(new fields.StringField())
        };
    }

    async _preDelete() {
        if (this.parent.parent.type === 'character') {
            const update = {
                height: this.characterTokenData.tokenSize.height,
                width: this.characterTokenData.tokenSize.width,
                texture: {
                    src: this.characterTokenData.tokenImg
                }
            };

            await updateActorTokens(this.parent.parent, update);

            for (var feature of this.parent.parent.items.filter(x => this.featureIds.includes(x.id))) {
                await feature.delete();
            }

            for (var effect of this.parent.parent.effects.filter(x => this.effectIds.includes(x.id))) {
                await effect.delete();
            }
        }
    }
}
