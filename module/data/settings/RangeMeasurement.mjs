export default class DhRangeMeasurement extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            enabled: new fields.BooleanField({ required: true, initial: false, label: 'DAGGERHEART.General.enabled' }),
            melee: new fields.NumberField({ required: true, initial: 5, label: 'DAGGERHEART.Config.Range.melee.name' }),
            veryClose: new fields.NumberField({
                required: true,
                initial: 15,
                label: 'DAGGERHEART.Config.Range.veryClose.name'
            }),
            close: new fields.NumberField({
                required: true,
                initial: 30,
                label: 'DAGGERHEART.Config.Range.close.name'
            }),
            far: new fields.NumberField({ required: true, initial: 60, label: 'DAGGERHEART.Config.Range.far.name' }),
            veryFar: new fields.NumberField({
                required: true,
                initial: 120,
                label: 'DAGGERHEART.Config.Range.veryFar.name'
            })
        };
    }
}
