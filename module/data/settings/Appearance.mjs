import { fearDisplay } from '../../config/generalConfig.mjs';

export default class DhAppearance extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            displayFear: new fields.StringField({
                required: true,
                choices: fearDisplay,
                initial: fearDisplay.token.value,
                label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.displayFear.label'
            }),
            diceSoNice: new fields.SchemaField({
                hope: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    background: new fields.ColorField({ required: true, initial: '#ffe760' }),
                    outline: new fields.ColorField({ required: true, initial: '#000000' }),
                    edge: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    texture: new fields.StringField({ initial: 'astralsea' }),
                    colorset: new fields.StringField({ initial: 'inspired' }),
                    material: new fields.StringField({ initial: 'metal' }),
                    system: new fields.StringField({ initial: 'standard' })
                }),
                fear: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#000000' }),
                    background: new fields.ColorField({ required: true, initial: '#0032b1' }),
                    outline: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    edge: new fields.ColorField({ required: true, initial: '#000000' }),
                    texture: new fields.StringField({ initial: 'astralsea' }),
                    colorset: new fields.StringField({ initial: 'inspired' }),
                    material: new fields.StringField({ initial: 'metal' }),
                    system: new fields.StringField({ initial: 'standard' })
                }),
                advantage: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    background: new fields.ColorField({ required: true, initial: '#008000' }),
                    outline: new fields.ColorField({ required: true, initial: '#000000' }),
                    edge: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    texture: new fields.StringField({ initial: 'astralsea' }),
                    colorset: new fields.StringField({ initial: 'inspired' }),
                    material: new fields.StringField({ initial: 'metal' }),
                    system: new fields.StringField({ initial: 'standard' })
                }),
                disadvantage: new fields.SchemaField({
                    foreground: new fields.ColorField({ required: true, initial: '#000000' }),
                    background: new fields.ColorField({ required: true, initial: '#b30000' }),
                    outline: new fields.ColorField({ required: true, initial: '#ffffff' }),
                    edge: new fields.ColorField({ required: true, initial: '#000000' }),
                    texture: new fields.StringField({ initial: 'astralsea' }),
                    colorset: new fields.StringField({ initial: 'inspired' }),
                    material: new fields.StringField({ initial: 'metal' }),
                    system: new fields.StringField({ initial: 'standard' })
                })
            }),
            showGenericStatusEffects: new fields.BooleanField({
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showGenericStatusEffects.label'
            }),
            extendCharacterDescriptions: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.extendCharacterDescriptions.label'
            }),
            extendAdversaryDescriptions: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.extendAdversaryDescriptions.label'
            }),
            extendEnvironmentDescriptions: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.extendEnvironmentDescriptions.label'
            }),
            extendItemDescriptions: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.extendItemDescriptions.label'
            }),
            expandRollMessage: new fields.SchemaField({
                desc: new fields.BooleanField({
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.expandRollMessageDesc.label'
                }),
                roll: new fields.BooleanField({
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.expandRollMessageRoll.label'
                }),
                damage: new fields.BooleanField({
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.expandRollMessageDamage.label'
                }),
                target: new fields.BooleanField({
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.expandRollMessageTarget.label'
                })
            })
        };
    }
}
