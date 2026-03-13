export default class DhAppearance extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.SETTINGS.Appearance'];

    static sfxSchema = () =>
        new foundry.data.fields.SchemaField({
            class: new foundry.data.fields.StringField({
                nullable: true,
                initial: null,
                blank: true,
                choices: CONFIG.DH.GENERAL.diceSoNiceSFXClasses
            })
        });

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
                font: new StringField({ initial: 'auto', required: true, blank: false }),
                sfx: new SchemaField({
                    higher: DhAppearance.sfxSchema()
                })
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
                disadvantage: diceStyle({ fg: '#000000', bg: '#b30000', outline: '#ffffff', edge: '#000000' }),
                sfx: new SchemaField({
                    critical: DhAppearance.sfxSchema()
                })
            }),
            extendCharacterDescriptions: new BooleanField(),
            extendAdversaryDescriptions: new BooleanField(),
            extendEnvironmentDescriptions: new BooleanField(),
            extendItemDescriptions: new BooleanField(),
            expandRollMessage: new SchemaField({
                desc: new BooleanField({ initial: true }),
                roll: new BooleanField(),
                damage: new BooleanField(),
                target: new BooleanField()
            }),
            showTokenDistance: new StringField({
                required: true,
                choices: {
                    always: {
                        value: 'always',
                        label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showTokenDistance.choices.always'
                    },
                    encounters: {
                        value: 'encounters',
                        label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showTokenDistance.choices.encounters'
                    },
                    never: {
                        value: 'never',
                        label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showTokenDistance.choices.never'
                    }
                },
                nullable: false,
                initial: 'always'
            }),
            hideAttribution: new BooleanField(),
            showGenericStatusEffects: new BooleanField({ initial: true })
        };
    }

    get diceSoNiceData() {
        const globalOverrides = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides);
        const getSFX = (baseClientData, overrideKey) => {
            if (!globalOverrides.diceSoNice.sfx.overrideEnabled) return baseClientData;
            const overrideData = globalOverrides.diceSoNice.sfx[overrideKey];
            const clientData = foundry.utils.deepClone(baseClientData);
            return Object.keys(clientData).reduce((acc, key) => {
                const data = clientData[key];
                acc[key] = Object.keys(data).reduce((acc, dataKey) => {
                    const value = data[dataKey];
                    acc[dataKey] = value ? value : overrideData[key][dataKey];
                    return acc;
                }, {});
                return acc;
            }, {});
        };

        return {
            ...this.diceSoNice,
            sfx: getSFX(this.diceSoNice.sfx, 'global'),
            hope: {
                ...this.diceSoNice.hope,
                sfx: getSFX(this.diceSoNice.hope.sfx, 'hope')
            },
            fear: {
                ...this.diceSoNice.fear,
                sfx: getSFX(this.diceSoNice.fear.sfx, 'fear')
            }
        };
    }

    /** Invoked by the setting when data changes */
    handleChange() {
        if (this.displayFear) {
            if (ui.resources) {
                if (this.displayFear === 'hide') ui.resources.close({ allowed: true });
                else ui.resources.render({ force: true });
            }
        }

        const globalOverrides = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides);
        globalOverrides.diceSoNiceSFXUpdate(this);
    }
}
