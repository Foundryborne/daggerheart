import { MigrationHandlerBase } from './base.mjs';

/**
 * Voidborne deleted rest actions due to the way it was implemented.
 * The current code is now more resilient to those updates, so we reset the actions.
 */
export class Migration_2_10_10_FixMoves extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.10.10';

    /** @inheritdoc */
    async migrate() {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).toObject();
        let shouldUpdate = false;
        for (const group of ['shortRest', 'longRest']) {
            setting.restMoves[group].moves ??= {};
            const currentMoves = setting.restMoves[group].moves;
            const defaultMoves = CONFIG.DH.GENERAL.defaultRestOptions[group]();
            for (const [key, value] of Object.entries(defaultMoves)) {
                const currentMove = currentMoves[key];
                const defaultActions = value.actions;
                if (foundry.utils.isEmpty(defaultActions)) continue; // nothing to do
                
                // If a move was purposefully deleted entirely, ignore it
                if (!currentMove) continue;
                
                if (foundry.utils.isEmpty(currentMoves.actions)) {
                    shouldUpdate = true;
                    currentMove.actions = defaultActions;
                }
            }
        }

        if (shouldUpdate) {
            game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, setting);
        }
    }
}
