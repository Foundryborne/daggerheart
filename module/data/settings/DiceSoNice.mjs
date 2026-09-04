/** Data model to store the setting for dice so nice hope/fear configuration. */
export class DhDiceSoNice extends foundry.abstract.DataModel {
    static sfxSchema = () =>
        new foundry.data.fields.SchemaField({
            class: new foundry.data.fields.StringField({
                nullable: true,
                initial: null,
                blank: true,
                choices: CONFIG.DH.GENERAL.diceSoNiceSFXClasses
            }),
            options: new foundry.data.fields.SchemaField({
                muteSound: new foundry.data.fields.BooleanField()
            })
        });
    
    static defineSchema() {
        const { StringField, ColorField, SchemaField } = foundry.data.fields;
        
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
                    higher: DhDiceSoNice.sfxSchema()
                })
            });

        return {
            hope: diceStyle({ fg: '#ffffff', bg: '#ffe760', outline: '#000000', edge: '#ffffff' }),
            fear: diceStyle({ fg: '#000000', bg: '#0032b1', outline: '#ffffff', edge: '#000000' }),
            advantage: diceStyle({ fg: '#ffffff', bg: '#008000', outline: '#000000', edge: '#ffffff' }),
            disadvantage: diceStyle({ fg: '#000000', bg: '#b30000', outline: '#ffffff', edge: '#000000' }),
            sfx: new SchemaField({
                critical: DhDiceSoNice.sfxSchema()
            })
        }
    }

    // todo find references and replace
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
            ...this,
            sfx: getSFX(this.sfx, 'global'),
            hope: {
                ...this.hope,
                sfx: getSFX(this.hope.sfx, 'hope')
            },
            fear: {
                ...this.fear,
                sfx: getSFX(this.fear.sfx, 'fear')
            }
        };
    }

    handleChange() {
        const globalOverrides = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides);
        globalOverrides.diceSoNiceSFXUpdate(this);
    }
}