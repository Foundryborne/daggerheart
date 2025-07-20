import BeastformDialog from '../../applications/dialogs/beastformDialog.mjs';
import DHBaseAction from './baseAction.mjs';

export default class DhBeastformAction extends DHBaseAction {
    static extraSchemas = ['beastform'];

    async use(event, ...args) {
        const beastformConfig = this.prepareBeastformConfig();

        const abort = await this.handleActiveTransformations();
        if (abort) return;

        const { selected, evolved, hybrid } = await BeastformDialog.configure(beastformConfig);
        if (!selected) return;

        await this.transform(selected, evolved, hybrid);
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

    async transform(selectedForm, evolvedData, hybridData) {
        const formData = evolvedData?.form ? evolvedData.form.toObject() : selectedForm.toObject();
        const beastformEffect = formData.effects.find(x => x.type === 'beastform');
        if (!beastformEffect) {
            ui.notifications.error('DAGGERHEART.UI.Notifications.beastformMissingEffect');
            return;
        }

        if (evolvedData?.form) {
            const evolvedForm = selectedForm.effects.find(x => x.type === 'beastform');
            if (!evolvedForm) {
                ui.notifications.error('DAGGERHEART.UI.Notifications.beastformMissingEffect');
                return;
            }

            beastformEffect.changes = [...beastformEffect.changes, ...evolvedForm.changes];
            formData.system.features = [...formData.system.features, ...selectedForm.system.features.map(x => x.uuid)];
        }

        if (selectedForm.system.beastformType === CONFIG.DH.ITEM.beastformTypes.hybrid.id) {
            formData.system.advantageOn = Object.values(hybridData.advantages).reduce((advantages, formCategory) => {
                Object.keys(formCategory).forEach(advantageKey => {
                    advantages[advantageKey] = formCategory[advantageKey];
                });
                return advantages;
            }, {});
            formData.system.features = [
                ...formData.system.features,
                ...Object.values(hybridData.features).flatMap(x => Object.keys(x))
            ];
        }

        this.actor.createEmbeddedDocuments('Item', [formData]);
    }

    async handleActiveTransformations() {
        const beastformEffects = this.actor.effects.filter(x => x.type === 'beastform');
        const existingEffects = beastformEffects.length > 0;
        await this.actor.deleteEmbeddedDocuments(
            'ActiveEffect',
            beastformEffects.map(x => x.id)
        );
        return existingEffects;
    }
}
