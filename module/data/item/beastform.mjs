import { updateActorTokens } from '../../helpers/utils.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import BaseDataItem from './base.mjs';

export default class DHBeastform extends BaseDataItem {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ITEMS.Beastform'];

    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.beastform',
            type: 'beastform',
            hasDescription: false
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            beastformType: new fields.StringField({
                required: true,
                choices: CONFIG.DH.ITEM.beastformTypes,
                initial: CONFIG.DH.ITEM.beastformTypes.normal.id
            }),
            tier: new fields.NumberField({
                required: true,
                integer: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers[1].id
            }),
            tokenImg: new fields.FilePathField({
                initial: 'icons/svg/mystery-man.svg',
                categories: ['IMAGE'],
                wildcard: true,
                base64: false
            }),
            tokenRingImg: new fields.FilePathField({
                initial: 'icons/svg/mystery-man.svg',
                categories: ['IMAGE'],
                wildcard: true,
                base64: false
            }),
            tokenSize: new fields.SchemaField({
                size: new fields.StringField({
                    required: true,
                    nullable: false,
                    choices: CONFIG.DH.ACTOR.tokenSize,
                    initial: CONFIG.DH.ACTOR.tokenSize.custom.id
                }),
                height: new fields.NumberField({ integer: true, min: 1, initial: null, nullable: true }),
                width: new fields.NumberField({ integer: true, min: 1, initial: null, nullable: true })
            }),
            mainTrait: new fields.StringField({
                required: true,
                choices: CONFIG.DH.ACTOR.abilities,
                initial: CONFIG.DH.ACTOR.abilities.agility.id
            }),
            examples: new fields.StringField(),
            advantageOn: new fields.TypedObjectField(
                new fields.SchemaField({
                    value: new fields.StringField()
                })
            ),
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' }),
            evolved: new fields.SchemaField({
                maximumTier: new fields.NumberField({
                    integer: true,
                    choices: CONFIG.DH.GENERAL.tiers
                }),
                mainTraitBonus: new fields.NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    initial: 0
                })
            }),
            hybrid: new fields.SchemaField({
                maximumTier: new fields.NumberField({
                    integer: true,
                    choices: CONFIG.DH.GENERAL.tiers,
                    label: 'DAGGERHEART.ITEMS.Beastform.FIELDS.evolved.maximumTier.label'
                }),
                beastformOptions: new fields.NumberField({ required: true, integer: true, initial: 2, min: 2 }),
                advantages: new fields.NumberField({ required: true, integer: true, initial: 2, min: 2 }),
                features: new fields.NumberField({ required: true, integer: true, initial: 2, min: 2 })
            })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/wolf-head.svg';

    /* -------------------------------------------- */

    get beastformAttackData() {
        const effect = this.parent.effects.find(x => x.type === 'beastform');
        if (!effect) return null;

        const traitBonus = effect.changes.find(x => x.key === `system.traits.${this.mainTrait}.value`)?.value ?? 0;
        const evasionBonus = effect.changes.find(x => x.key === 'system.evasion')?.value ?? 0;

        const damageDiceIndex = effect.changes.find(x => x.key === 'system.rules.attack.damage.diceIndex');
        const damageDice = damageDiceIndex ? Object.keys(CONFIG.DH.GENERAL.diceTypes)[damageDiceIndex.value] : null;
        const damageBonus = effect.changes.find(x => x.key === 'system.rules.attack.damage.bonus')?.value ?? 0;

        return {
            trait: game.i18n.localize(CONFIG.DH.ACTOR.abilities[this.mainTrait].label),
            traitBonus: traitBonus ? Number(traitBonus).signedString() : '',
            evasionBonus: evasionBonus ? Number(evasionBonus).signedString() : '',
            damageDice: damageDice,
            damageBonus: damageBonus ? `${Number(damageBonus).signedString()}` : ''
        };
    }

    static async getWildcardImage(actor, beastform) {
        const usesDynamicToken = actor.prototypeToken.ring.enabled && beastform.system.tokenRingImg;
        const tokenPath = usesDynamicToken ? beastform.system.tokenRingImg : beastform.system.tokenImg;
        const usesWildcard = tokenPath.includes('*');
        if (usesWildcard) {
            const filePicker = new foundry.applications.apps.FilePicker.implementation(tokenPath);
            const { files } = await foundry.applications.apps.FilePicker.implementation.browse(
                filePicker.activeSource,
                tokenPath,
                {
                    wildcard: true,
                    type: 'image'
                }
            );
            const selectedImage = await game.system.api.applications.dialogs.ImageSelectDialog.configure(
                game.i18n.localize('DAGGERHEART.APPLICATIONS.ImageSelect.title'),
                files
            );
            return { usesDynamicToken, selectedImage };
        }

        return null;
    }

    async _preCreate() {
        if (!this.actor) return;

        if (this.actor.type !== 'character') {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.beastformInapplicable'));
            return false;
        }

        if (this.actor.items.find(x => x.type === 'beastform')) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.beastformAlreadyApplied'));
            return false;
        }

        const beastformFeatures = [];
        for (let featureData of this.features) {
            const feature = await foundry.utils.fromUuid(featureData.uuid);
            beastformFeatures.push(feature.toObject());
        }

        const features = await this.parent.parent.createEmbeddedDocuments('Item', beastformFeatures);

        const extraEffects = await this.parent.parent.createEmbeddedDocuments(
            'ActiveEffect',
            this.parent.effects.filter(x => x.type !== 'beastform').map(x => x.toObject())
        );

        const beastformEffect = this.parent.effects.find(x => x.type === 'beastform');
        await beastformEffect.updateSource({
            changes: [
                ...beastformEffect.changes,
                {
                    key: 'system.advantageSources',
                    mode: 2,
                    value: Object.values(this.advantageOn)
                        .map(x => x.value)
                        .join(', ')
                }
            ],
            system: {
                characterTokenData: {
                    usesDynamicToken: this.parent.parent.prototypeToken.ring.enabled,
                    tokenImg: this.parent.parent.prototypeToken.texture.src,
                    tokenRingImg: this.parent.parent.prototypeToken.ring.subject.texture,
                    tokenSize: {
                        height: this.parent.parent.prototypeToken.height,
                        width: this.parent.parent.prototypeToken.width
                    }
                },
                advantageOn: this.advantageOn,
                featureIds: features.map(x => x.id),
                effectIds: extraEffects.map(x => x.id)
            }
        });

        await this.parent.parent.createEmbeddedDocuments('ActiveEffect', [beastformEffect.toObject()]);

        const autoTokenSize =
            this.tokenSize.size !== 'custom'
                ? game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes[
                      this.tokenSize.size
                  ]
                : null;
        const width = autoTokenSize ?? this.tokenSize.width;
        const height = autoTokenSize ?? this.tokenSize.height;

        const prototypeTokenUpdate = {
            height,
            width,
            texture: {
                src: this.tokenImg
            },
            ring: {
                subject: {
                    texture: this.tokenRingImg
                }
            }
        };
        const tokenUpdate = token => {
            let x = null,
                y = null;
            if (token.object?.scene?.grid) {
                const positionData = game.system.api.documents.DhToken.getSnappedPositionInSquareGrid(
                    token.object.scene.grid,
                    { x: token.x, y: token.y, elevation: token.elevation },
                    width ?? token.width,
                    height ?? token.height
                );

                x = positionData.x;
                y = positionData.y;
            }

            return {
                ...prototypeTokenUpdate,
                x,
                y,
                flags: {
                    daggerheart: {
                        beastformTokenImg: token.texture.src,
                        beastformSubjectTexture: token.ring.subject.texture
                    }
                }
            };
        };

        await updateActorTokens(this.parent.parent, prototypeTokenUpdate, tokenUpdate);

        return false;
    }
}
