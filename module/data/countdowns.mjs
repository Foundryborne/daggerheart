import { countdownTypes } from '../config/generalConfig.mjs';

export default class DhCountdowns extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            narrative: new fields.EmbeddedDataField(DhCountdownData),
            encounter: new fields.EmbeddedDataField(DhCountdownData)
        };
    }

    static CountdownCategories = { narrative: 'narrative', combat: 'combat' };
}

class DhCountdownData extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Countdown']; // Nots ure why this won't work. Setting labels manually for now

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            countdowns: new fields.TypedObjectField(new fields.EmbeddedDataField(DhCountdown))
        };
    }
}

class DhCountdown extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            name: new fields.StringField({
                required: true,
                label: 'DAGGERHEART.Countdown.FIELDS.countdowns.element.name.label'
            }),
            img: new fields.FilePathField({
                categories: ['IMAGE'],
                base64: false,
                initial: 'icons/magic/time/hourglass-yellow-green.webp'
            }),
            progress: new fields.SchemaField({
                current: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 0,
                    label: 'DAGGERHEART.Countdown.FIELDS.countdowns.element.progress.current.label'
                }),
                max: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 1,
                    label: 'DAGGERHEART.Countdown.FIELDS.countdowns.element.progress.max.label'
                }),
                type: new fields.SchemaField({
                    value: new fields.StringField({
                        required: true,
                        choices: countdownTypes,
                        initial: countdownTypes.spotlight.id,
                        label: 'DAGGERHEART.Countdown.FIELDS.countdowns.element.progress.type.value.label'
                    }),
                    label: new fields.StringField({
                        label: 'DAGGERHEART.Countdown.FIELDS.countdowns.element.progress.type.label.label'
                    })
                })
            })
        };
    }
}
