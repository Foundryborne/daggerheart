import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import DHEnvironmentSettings from '../../applications/sheets-configs/environment-settings.mjs';

export default class DhEnvironment extends BaseDataActor {
    /**@override */
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Environment'];

    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.environment',
            type: 'environment',
            settingSheet: DHEnvironmentSettings,
            hasResistances: false,
            hasAttribution: true
        });
    }

    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({
                required: true,
                integer: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers[1].id
            }),
            type: new fields.StringField({ choices: CONFIG.DH.ACTOR.environmentTypes }),
            impulses: new fields.StringField(),
            difficulty: new fields.NumberField({ required: true, initial: 11, integer: true }),
            potentialAdversaries: new fields.TypedObjectField(
                new fields.SchemaField({
                    label: new fields.StringField(),
                    adversaries: new ForeignDocumentUUIDArrayField({ type: 'Actor' })
                })
            ),
            notes: new fields.HTMLField()
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/forest.svg';

    /* -------------------------------------------- */

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }
}
