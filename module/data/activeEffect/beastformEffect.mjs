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
                    scale: new fields.NumberField({ nullable: false, initial: 1 }),
                    height: new fields.NumberField({ integer: false, nullable: true }),
                    width: new fields.NumberField({ integer: false, nullable: true })
                })
            }),
            advantageOn: new fields.ArrayField(new fields.StringField()),
            featureIds: new fields.ArrayField(new fields.StringField()),
            effectIds: new fields.ArrayField(new fields.StringField())
        };
    }

    /** @inheritDoc */
    static migrateData(source) {
        if (!source.characterTokenData.tokenSize.height) source.characterTokenData.tokenSize.height = 1;
        if (!source.characterTokenData.tokenSize.width) source.characterTokenData.tokenSize.width = 1;

        return super.migrateData(source);
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
                    src: this.characterTokenData.tokenImg,
                    scaleX: this.characterTokenData.tokenSize.scale,
                    scaleY: this.characterTokenData.tokenSize.scale
                },
                ring: {
                    enabled: this.characterTokenData.usesDynamicToken,
                    subject: {
                        texture: this.characterTokenData.tokenRingImg
                    }
                }
            };

            const updateToken = token => {
                let x = null,
                    y = null;
                if (token.object?.scene?.grid) {
                    const positionData = game.system.api.documents.DhToken.getSnappedPositionInSquareGrid(
                        token.object.scene.grid,
                        { x: token.x, y: token.y, elevation: token.elevation },
                        baseUpdate.width,
                        baseUpdate.height
                    );

                    x = positionData.x;
                    y = positionData.y;
                }

                return {
                    ...baseUpdate,
                    x,
                    y,
                    'texture': {
                        enabled: this.characterTokenData.usesDynamicToken,
                        src: token.flags.daggerheart?.beastformTokenImg ?? this.characterTokenData.tokenImg,
                        scaleX: this.characterTokenData.tokenSize.scale,
                        scaleY: this.characterTokenData.tokenSize.scale
                    },
                    'ring': {
                        subject: {
                            texture:
                                token.flags.daggerheart?.beastformSubjectTexture ?? this.characterTokenData.tokenRingImg
                        }
                    },
                    'flags.daggerheart': { '-=beastformTokenImg': null, '-=beastformSubjectTexture': null }
                };
            };

            await updateActorTokens(this.parent.parent, update, updateToken);

            await this.parent.parent.deleteEmbeddedDocuments('Item', this.featureIds);
            await this.parent.parent.deleteEmbeddedDocuments('ActiveEffect', this.effectIds);
        }
    }
}
