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
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers.tier1.id
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
            examples: new fields.StringField(),
            advantageOn: new fields.ArrayField(new fields.StringField()),
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' })
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

        const features = await this.parent.parent.createEmbeddedDocuments(
            'Item',
            this.features.map(x => x.toObject())
        );
        const effects = await this.parent.parent.createEmbeddedDocuments(
            'ActiveEffect',
            this.parent.effects.map(x => x.toObject())
        );

        await this.parent.parent.createEmbeddedDocuments('ActiveEffect', [
            {
                type: 'beastform',
                name: game.i18n.localize('DAGGERHEART.ITEMS.Beastform.beastformEffect'),
                img: 'icons/creatures/abilities/paw-print-pair-purple.webp',
                system: {
                    isBeastform: true,
                    characterTokenData: {
                        tokenImg: this.parent.parent.prototypeToken.texture.src,
                        tokenSize: {
                            height: this.parent.parent.prototypeToken.height,
                            width: this.parent.parent.prototypeToken.width
                        }
                    },
                    advantageOn: this.advantageOn,
                    featureIds: features.map(x => x.id),
                    effectIds: effects.map(x => x.id)
                }
            }
        ]);

        await updateActorTokens(this.parent.parent, {
            height: this.tokenSize.height,
            width: this.tokenSize.width,
            texture: {
                src: this.tokenImg
            }
        });

        return false;
    }
}
