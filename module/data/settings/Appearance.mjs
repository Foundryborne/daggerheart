export default class DhAppearance extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.SETTINGS.Appearance'];

    static defineSchema() {
        const { StringField, ColorField, BooleanField, SchemaField } = foundry.data.fields;

        // helper to create dice style schema
        const diceStyle = ({ fg, bg, outline, edge }) =>
            new SchemaField({
                foreground: new ColorField({ required: true, initial: fg }),
                background: new ColorField({ required: true, initial: bg }),
                outline: new ColorField({ required: true, initial: outline }),
                edge: new ColorField({ required: true, initial: edge }),
                texture: new StringField({ initial: 'astralsea', required: true, blank: false }),
                colorset: new StringField({ initial: 'inspired', required: true, blank: false }),
                material: new StringField({ initial: 'metal', required: true, blank: false }),
                system: new StringField({ initial: 'standard', required: true, blank: false }),
                font: new StringField({ initial: 'auto', required: true, blank: false })
            });

        return {
            useResourcePips: new BooleanField({ initial: false }),
            displayFear: new StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.fearDisplay,
                initial: CONFIG.DH.GENERAL.fearDisplay.token.value
            }),
            displayCountdownUI: new BooleanField({ initial: true }),
            diceSoNice: new SchemaField({
                hope: diceStyle({ fg: '#ffffff', bg: '#ffe760', outline: '#000000', edge: '#ffffff' }),
                fear: diceStyle({ fg: '#000000', bg: '#0032b1', outline: '#ffffff', edge: '#000000' }),
                advantage: diceStyle({ fg: '#ffffff', bg: '#008000', outline: '#000000', edge: '#ffffff' }),
                disadvantage: diceStyle({ fg: '#000000', bg: '#b30000', outline: '#ffffff', edge: '#000000' })
            }),
            extendCharacterDescriptions: new BooleanField(),
            extendAdversaryDescriptions: new BooleanField(),
            extendEnvironmentDescriptions: new BooleanField(),
            extendItemDescriptions: new BooleanField(),
            expandRollMessage: new SchemaField({
                desc: new BooleanField(),
                roll: new BooleanField(),
                damage: new BooleanField(),
                target: new BooleanField()
            }),
            hideAttribution: new BooleanField(),
            showGenericStatusEffects: new BooleanField({ initial: true })
        };
    }
}
