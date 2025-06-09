import { environmentTypes } from '../config/actorConfig.mjs';
import ForeignDocumentUUIDField from './fields/foreignDocumentUUIDField.mjs';

export default class DhEnvironment extends foundry.abstract.TypeDataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Sheets.Environment'];

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            tier: new fields.StringField({
                required: true,
                choices: SYSTEM.GENERAL.tiers,
                initial: SYSTEM.GENERAL.tiers.tier1.id
            }),
            type: new fields.StringField({ choices: environmentTypes }),
            description: new fields.HTMLField(),
            impulses: new fields.HTMLField(),
            difficulty: new fields.NumberField({ required: true, initial: 11, integer: true }),
            potentialAdversaries: new fields.TypedObjectField(
                new fields.SchemaField({
                    label: new fields.StringField(),
                    adversaries: new fields.TypedObjectField(new ForeignDocumentUUIDField({ type: 'Actor' }))
                })
            )
            /* Features pending datamodel rework */
        };
    }
}
