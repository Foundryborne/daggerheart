import { fearDisplay } from '../../config/generalConfig.mjs';

export default class DhAppearance extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            displayFear: new fields.StringField({
                required: true,
                choices: fearDisplay,
                initial: fearDisplay.token.value,
                label: 'DAGGERHEART.Settings.Appearance.FIELDS.displayFear.label'
            }),
            dualityColorScheme: new fields.StringField({
                required: true,
                choices: DualityRollColor,
                initial: DualityRollColor.normal.value
            }),
            diceSoNice: new fields.SchemaField({
                hope: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    background: new fields.ColorField({ required: true, initial: '#ffe760' }),
                    outline: new fields.ColorField({ required: true, initial: '#000000' }),
                    edge: new fields.ColorField({ required: true, initial: '#ffffff' })
                }),
                fear: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#000000' }),
                    background: new fields.ColorField({ required: true, initial: '#0032b1' }),
                    outline: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    edge: new fields.ColorField({ required: true, initial: '#000000' })
                }),
                advantage: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    background: new fields.ColorField({ required: true, initial: '#008000' }),
                    outline: new fields.ColorField({ required: true, initial: '#000000' }),
                    edge: new fields.ColorField({ required: true, initial: '#ffffff' })
                }),
                disadvantage: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#000000' }),
                    background: new fields.ColorField({ required: true, initial: '#b30000' }),
                    outline: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    edge: new fields.ColorField({ required: true, initial: '#000000' })
                })
            })
        };
    }
}

export const DualityRollColor = {
    colorful: {
        value: 'colorful',
        label: 'DAGGERHEART.Settings.DualityRollColor.Options.Colorful'
    },
    normal: {
        value: 'normal',
        label: 'DAGGERHEART.Settings.DualityRollColor.Options.Normal'
    }
};
