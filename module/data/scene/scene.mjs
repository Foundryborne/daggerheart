import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';

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
            sceneEnvironments: new fields.TypedObjectField(
                new fields.SchemaField({
                    environment: new ForeignDocumentUUIDField({ type: 'Actor' }),
                    icon: new fields.StringField({
                        required: true,
                        initial: CONFIG.DH.GENERAL.environmentIcons.tree.icon
                    })
                })
            )
        };
    }
}
