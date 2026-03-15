import DhAppearance from './Appearance.mjs';

/**
 * A setting to handle cases where we want to allow the GM to set a global default for client settings.
 */
export default class DhGlobalOverrides extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            diceSoNice: new fields.SchemaField({
                sfx: new fields.SchemaField({
                    overrideEnabled: new fields.BooleanField(),
                    global: new fields.SchemaField({
                        critical: DhAppearance.sfxSchema()
                    }),
                    hope: new fields.SchemaField({
                        higher: DhAppearance.sfxSchema()
                    }),
                    fear: new fields.SchemaField({
                        higher: DhAppearance.sfxSchema()
                    })
                })
            })
        };
    }

    async diceSoNiceSFXUpdate(appearanceSettings, enabled) {
        if (!game.user.isGM) return;

        const newEnabled = enabled !== undefined ? enabled : this.diceSoNice.sfx.overrideEnabled;
        if (newEnabled) {
            const newOverrides = foundry.utils.mergeObject(this.toObject(), {
                diceSoNice: {
                    sfx: {
                        overrideEnabled: true,
                        global: appearanceSettings.diceSoNice.sfx,
                        hope: appearanceSettings.diceSoNice.hope.sfx,
                        fear: appearanceSettings.diceSoNice.fear.sfx
                    }
                }
            });
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides, newOverrides);
        } else {
            const newOverrides = {
                ...this.toObject(),
                diceSoNice: {
                    sfx: {
                        overrideEnabled: false
                    }
                }
            };
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides, newOverrides);
        }
    }
}
