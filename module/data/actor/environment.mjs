import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import DHEnvironmentSettings from '../../applications/sheets-configs/environment-settings.mjs';

export default class DhEnvironment extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Environment'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.environment',
            type: 'environment',
            settingSheet: DHEnvironmentSettings,
            hasResistances: false
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers.tier1.id
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

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }
}
