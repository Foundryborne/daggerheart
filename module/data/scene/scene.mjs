import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';

/*  Foundry does not add any system data for subtyped Scenes. The data model is therefore used by instantiating a new instance of it for sceneConfigSettings.mjs.
    Needed dataprep and lifetime hooks are handled in documents/scene.
*/
export default class DHScene extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            rangeMeasurement: new fields.SchemaField({
                setting: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.sceneRangeMeasurementSetting,
                    initial: CONFIG.DH.GENERAL.sceneRangeMeasurementSetting.default.id,
                    label: 'DAGGERHEART.SETTINGS.Scene.FIELDS.rangeMeasurement.setting.label'
                }),
                melee: new fields.NumberField({ integer: true, label: 'DAGGERHEART.CONFIG.Range.melee.name' }),
                veryClose: new fields.NumberField({ integer: true, label: 'DAGGERHEART.CONFIG.Range.veryClose.name' }),
                close: new fields.NumberField({ integer: true, label: 'DAGGERHEART.CONFIG.Range.close.name' }),
                far: new fields.NumberField({ integer: true, label: 'DAGGERHEART.CONFIG.Range.far.name' })
            }),
            sceneEnvironments: new ForeignDocumentUUIDArrayField({ type: 'Actor', prune: true })
        };
    }
}
