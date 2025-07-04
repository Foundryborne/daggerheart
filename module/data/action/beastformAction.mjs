import BeastformDialog from '../../applications/dialogs/beastformDialog.mjs';
import DHBaseAction from './baseAction.mjs';

export default class DhBeastformAction extends DHBaseAction {
    static extraSchemas = ['beastform'];

    async use(event, ...args) {
        const beastformConfig = this.prepareBeastformConfig();

        const abort = await this.handleActiveTransformations();
        if (abort) return;

        const beastformUuid = await BeastformDialog.configure(beastformConfig);
        if (!beastformUuid) return;

        await this.transform(beastformUuid);
    }

    prepareBeastformConfig(config) {
        const settingsTiers = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers;
        const actorLevel = this.actor.system.levelData.level.current;
        const actorTier =
            Object.values(settingsTiers).find(
                tier => actorLevel >= tier.levels.start && actorLevel <= tier.levels.end
            ) ?? 1;

        return {
            tierLimit: this.beastform.tierAccess.exact ?? actorTier
        };
    }

    async transform(beastformUuid) {
        const beastform = await foundry.utils.fromUuid(beastformUuid);
        this.actor.createEmbeddedDocuments('Item', [beastform.toObject()]);
    }

    async handleActiveTransformations() {
        const beastformEffects = this.actor.effects.filter(x => x.type === 'beastform');
        if (beastformEffects.length > 0) {
            for (let effect of beastformEffects) {
                await effect.delete();
            }

            return true;
        }

        return false;
    }
}
