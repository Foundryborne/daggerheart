import { updateActorTokens } from '../../helpers/utils.mjs';
import BaseEffect from './baseEffect.mjs';

export default class BeastformEffect extends BaseEffect {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            characterTokenData: new fields.SchemaField({
                usesDynamicToken: new fields.BooleanField({ initial: false }),
                tokenImg: new fields.FilePathField({
                    categories: ['IMAGE'],
                    base64: false,
                    nullable: true,
                    wildcard: true
                }),
                tokenRingImg: new fields.FilePathField({
                    initial: 'icons/svg/mystery-man.svg',
                    categories: ['IMAGE'],
                    base64: false
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

    async _onCreate(_data, _options, userId) {
        if (userId !== game.user.id) return;

        if (this.parent.parent?.type === 'character') {
            this.parent.parent.system.primaryWeapon?.update?.({ 'system.equipped': false });
            this.parent.parent.system.secondaryWeapon?.update?.({ 'system.equipped': false });
        }
    }

    async _preDelete() {
        if (this.parent.parent.type === 'character') {
            const baseUpdate = {
                height: this.characterTokenData.tokenSize.height,
                width: this.characterTokenData.tokenSize.width
            };
            const update = {
                ...baseUpdate,
                texture: {
                    src: this.characterTokenData.tokenImg
                },
                ring: {
                    enabled: this.characterTokenData.usesDynamicToken,
                    subject: {
                        texture: this.characterTokenData.tokenRingImg
                    }
                }
            };

            const updateToken = token => ({
                ...baseUpdate,
                'texture': {
                    enabled: this.characterTokenData.usesDynamicToken,
                    src: token.flags.daggerheart.beastformTokenImg
                },
                'ring': {
                    subject: {
                        texture: token.flags.daggerheart.beastformSubjectTexture
                    }
                },
                'flags.daggerheart': { '-=beastformTokenImg': null, '-=beastformSubjectTexture': null }
            });

            await updateActorTokens(this.parent.parent, update, updateToken);

            await this.parent.parent.deleteEmbeddedDocuments('Item', this.featureIds);
            await this.parent.parent.deleteEmbeddedDocuments('ActiveEffect', this.effectIds);
        }
    }
}
