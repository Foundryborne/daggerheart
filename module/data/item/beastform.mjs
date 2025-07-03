import { updateActorTokens } from '../../helpers/utils.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import BaseDataItem from './base.mjs';

export default class DHBeastform extends BaseDataItem {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Sheets.Beastform'];

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
            tier: new fields.StringField({
                required: true,
                choices: SYSTEM.GENERAL.tiers,
                initial: SYSTEM.GENERAL.tiers.tier1.id
            }),
            tokenImg: new fields.FilePathField({
                initial: 'icons/svg/mystery-man.svg',
                categories: ['IMAGE'],
                base64: false
            }),
            tokenSize: new fields.SchemaField({
                height: new fields.NumberField({ integer: true, min: 1, initial: null, nullable: true }),
                width: new fields.NumberField({ integer: true, min: 1, initial: null, nullable: true })
            }),
            characterTokenData: new fields.SchemaField({
                tokenImg: new fields.FilePathField({
                    categories: ['IMAGE'],
                    base64: false,
                    nullable: true,
                    initial: null
                }),
                tokenSize: new fields.SchemaField({
                    height: new fields.NumberField({ integer: true, initial: null, nullable: true }),
                    width: new fields.NumberField({ integer: true, initial: null, nullable: true })
                })
            }),
            examples: new fields.StringField(),
            advantageOn: new fields.ArrayField(new fields.StringField()),
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' })
        };
    }

    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        if (this.actor?.type !== 'character') {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.beastformInapplicable'));
            return;
        }

        if (this.actor.items.find(x => x.type === 'beastform')) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.beastformAlreadyApplied'));
            return;
        }

        await this.updateSource({
            characterTokenData: {
                tokenImg: this.parent.parent.prototypeToken.texture.src,
                tokenSize: {
                    height: this.parent.parent.prototypeToken.height,
                    width: this.parent.parent.prototypeToken.width
                }
            }
        });
    }

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        const update = {
            height: this.tokenSize.height,
            width: this.tokenSize.width,
            texture: {
                src: this.tokenImg
            }
        };
        updateActorTokens(this.parent.parent, update);

        this.parent.parent.createEmbeddedDocuments('ActiveEffect', [
            {
                type: 'beastform',
                name: game.i18n.localize('DAGGERHEART.Sheets.Beastform.beastformEffect'),
                img: 'icons/creatures/abilities/paw-print-pair-purple.webp',
                system: {
                    isBeastform: true
                }
            }
        ]);
    }

    async _preDelete() {
        const update = {
            height: this.characterTokenData.tokenSize.height,
            width: this.characterTokenData.tokenSize.width,
            texture: {
                src: this.characterTokenData.tokenImg
            }
        };
        await updateActorTokens(this.parent.parent, update);
    }
}
