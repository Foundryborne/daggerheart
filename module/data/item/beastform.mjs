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
                base64: false
            }),
            tokenRingImg: new fields.FilePathField({
                initial: 'icons/svg/mystery-man.svg',
                categories: ['IMAGE'],
                base64: false
            }),
            tokenSize: new fields.SchemaField({
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

        const tokenImages = await this.parent.parent.getTokenImages();
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
                    tokenImg: tokenImages[0],
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

        await updateActorTokens(this.parent.parent, {
            height: this.tokenSize.height,
            width: this.tokenSize.width,
            texture: {
                src: this.tokenImg
            },
            ring: {
                subject: {
                    texture: this.tokenRingImg
                }
            }
        });

        return false;
    }

    _onCreate(_data, _options, userId) {
        if (userId !== game.user.id) return;

        if (!this.parent.effects.find(x => x.type === 'beastform')) {
            this.parent.createEmbeddedDocuments('ActiveEffect', [
                {
                    type: 'beastform',
                    name: game.i18n.localize('DAGGERHEART.ITEMS.Beastform.beastformEffect'),
                    img: 'icons/creatures/abilities/paw-print-pair-purple.webp'
                }
            ]);
        }
    }
}
