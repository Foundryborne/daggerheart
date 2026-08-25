import { updateActorTokens } from '../../helpers/utils.mjs';
import BaseEffect from './baseEffect.mjs';

export default class BeastformEffect extends BaseEffect {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
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
            advantageOn: new fields.TypedObjectField(new fields.SchemaField({ value: new fields.StringField() })),
            featureIds: new fields.ArrayField(new fields.StringField()),
            effectIds: new fields.ArrayField(new fields.StringField())
        };
    }

    /** @inheritDoc */
    static migrateData(source) {
        if (source.characterTokenData && !source.characterTokenData.tokenSize.height) 
            source.characterTokenData.tokenSize.height = 1;
        if (source.characterTokenData && !source.characterTokenData.tokenSize.width) 
            source.characterTokenData.tokenSize.width = 1;
        if (source.characterTokenData && !source.characterTokenData.tokenSize.depth) 
            source.characterTokenData.tokenSize.depth = 1;

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
                width: this.characterTokenData.tokenSize.width,
                depth: this.characterTokenData.tokenSize.depth
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
                    texture: {
                        enabled: this.characterTokenData.usesDynamicToken,
                        src: token.flags.daggerheart?.beastformTokenImg ?? this.characterTokenData.tokenImg,
                        scaleX: this.characterTokenData.tokenSize.scale,
                        scaleY: this.characterTokenData.tokenSize.scale
                    },
                    ring: {
                        subject: {
                            texture:
                                token.flags.daggerheart?.beastformSubjectTexture ?? this.characterTokenData.tokenRingImg
                        }
                    },
                    'flags.daggerheart': { beastformTokenImg: _del, beastformSubjectTexture: _del }
                };
            };

            await updateActorTokens(this.parent.parent, update, updateToken);

            await this.parent.parent.deleteEmbeddedDocuments('Item', this.featureIds);
            await this.parent.parent.deleteEmbeddedDocuments('ActiveEffect', this.effectIds);
        }
    }

    getBeastformAttackData() {
        const actor = this.parent.parent;
        if (!actor) return null;

        const standardAttack = this.changes.find(x => x.type === 'standardAttack');
        const mainTrait = standardAttack?.value.trait;
        const traitBonus = this.changes.find(x => x.key === `system.traits.${mainTrait}.value`)?.value ?? 0;
        const evasionBonus = this.changes.find(x => x.key === 'system.evasion')?.value ?? 0;
        const damageFormula = standardAttack?.value.damageFormula;
        const damage = damageFormula && actor ? Roll.replaceFormulaData(damageFormula, actor.getRollData()) : '';
        return {
            trait: game.i18n.localize(CONFIG.DH.ACTOR.abilities[mainTrait]?.label),
            traitBonus: traitBonus ? Number(traitBonus).signedString() : '',
            evasionBonus: evasionBonus ? Number(evasionBonus).signedString() : '',
            damage
        };
    }
}
