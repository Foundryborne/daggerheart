import { MigrationHandlerBase } from './base.mjs';

/** Migrates action point automation to be part of the variant rule settings */
export class Migration_2_9_3 extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.9.3';

    async migrate() {
        const automationSetting = 
            game.settings.storage.get('world').getSetting(`${CONFIG.DH.id}.${CONFIG.DH.SETTINGS.gameSettings.Automation}`);
        if (!automationSetting) return;
        const rawAutomationData = JSON.parse(automationSetting.toJSON().value);

        const variantRules = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules);
        if (rawAutomationData.actionPoints) {
            await variantRules.updateSource({
                'actionTokens.automation': true
            });

            const update = variantRules.toObject();
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules, update);
        }
    }
}