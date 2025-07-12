export default class DhRangeMeasurement extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            enabled: new fields.BooleanField({ required: true, initial: true, label: 'DAGGERHEART.GENERAL.enabled' }),
            melee: new fields.NumberField({ required: true, initial: 5, label: 'DAGGERHEART.CONFIG.Range.melee.name' }),
            veryClose: new fields.NumberField({
                required: true,
                initial: 15,
                label: 'DAGGERHEART.CONFIG.Range.veryClose.name'
            }),
            close: new fields.NumberField({
                required: true,
                initial: 30,
                label: 'DAGGERHEART.CONFIG.Range.close.name'
            }),
            far: new fields.NumberField({ required: true, initial: 60, label: 'DAGGERHEART.CONFIG.Range.far.name' }),
            veryFar: new fields.NumberField({
                required: true,
                initial: 120,
                label: 'DAGGERHEART.CONFIG.Range.veryFar.name'
            })
        };
    }
}
