import { defaultRestOptions } from '../../config/generalConfig.mjs';
import { MigrationHandlerBase } from './base.mjs';

export class Migration_2_9_1 extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.9.1';

    async migrate() {
        const homebrew = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew);
        const shortMoves = defaultRestOptions.shortRest();
        const longMoves = defaultRestOptions.longRest();

        const updateMoves = (currentList, updatedMoves) => {
            return Object.entries(currentList).reduce((acc, [key, move]) => {
                acc[key] = updatedMoves[key] ?? move;
                return acc;
            }, {});
        };

        await homebrew.updateSource({
            restMoves: {
                shortMoves: { moves: updateMoves(homebrew.restMoves.shortRest.moves, shortMoves) },
                longMoves: { moves: updateMoves(homebrew.restMoves.longRest.moves, longMoves) }
            }
        });
        game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, homebrew.toObject());
    }
}