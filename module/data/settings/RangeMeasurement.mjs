export default class DhRangeMeasurement extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            enabled: new fields.BooleanField({ required: true, initial: false, label: 'DAGGERHEART.General.Enabled' }),
            melee: new fields.NumberField({ required: true, initial: 5, label: 'DAGGERHEART.Range.melee.name' }),
            veryClose: new fields.NumberField({
                required: true,
                initial: 15,
                label: 'DAGGERHEART.Range.veryClose.name'
            }),
            close: new fields.NumberField({ required: true, initial: 30, label: 'DAGGERHEART.Range.close.name' }),
            far: new fields.NumberField({ required: true, initial: 60, label: 'DAGGERHEART.Range.far.name' }),
            veryFar: new fields.NumberField({ required: true, initial: 120, label: 'DAGGERHEART.Range.veryFar.name' })
        };
    }
}
