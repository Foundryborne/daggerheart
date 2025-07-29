export default class BaseEffect extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            rangeDependence: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.GENERAL.enabled'
                }),
                type: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.rangeInclusion,
                    initial: CONFIG.DH.GENERAL.rangeInclusion.withinRange.id,
                    label: 'DAGGERHEART.GENERAL.type'
                }),
                target: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.otherTargetTypes,
                    initial: CONFIG.DH.GENERAL.otherTargetTypes.hostile.id,
                    label: 'DAGGERHEART.GENERAL.Target.single'
                }),
                range: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.range,
                    initial: CONFIG.DH.GENERAL.range.melee.id,
                    label: 'DAGGERHEART.GENERAL.range'
                })
            })
        };
    }
}
