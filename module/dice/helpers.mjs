import { ResourceUpdateMap } from '../data/action/baseAction.mjs';

export function updateResourcesForDualityReroll(oldDuality, newDuality, actor) {
    const { hopeFear } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
    if (game.user.isGM ? !hopeFear.gm : !hopeFear.players) return;

    const updates = [];
    const hope = (newDuality >= 0 ? 1 : 0) - (oldDuality >= 0 ? 1 : 0);
    const stress = (newDuality === 0 ? 1 : 0) - (oldDuality === 0 ? 1 : 0);
    const fear = (newDuality === -1 ? 1 : 0) - (oldDuality === -1 ? 1 : 0);

    if (hope !== 0) updates.push({ key: 'hope', value: hope, enabled: true });
    if (stress !== 0) updates.push({ key: 'stress', value: -1 * stress, enabled: true });
    if (fear !== 0) updates.push({ key: 'fear', value: fear, enabled: true });

    const resourceUpdates = new ResourceUpdateMap(actor);
    resourceUpdates.addResources(updates);
    resourceUpdates.updateResources();
}
