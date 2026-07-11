/** 
 * @import DHItem from "../../documents/item.mjs";
 */

/** 
 * The base class of an async migration. 
 * These are generally run between versions for things that require compendiums or must be done in post.
 * The migrate() functions calls the various updateXSource() functions.
 * Generally a subclass will override the version and the updateXSource() functions.
 */
export class MigrationHandlerBase {
    version = null;

    /**
     * Gets change data for an active effect's source, or null if no changes
     * @param {object} effectSource 
     * @param {DHItem} item 
     * @returns {Promise<object>}
     * @protected
     */
    async updateActiveEffectSource(effectSource, item) {
        return null;
    }

    async migrate() {
        // todo: handle more than just migrating effects. Right now this can only migrate effects
        // NOTE: the preload is hardcoded, we should not hardcode it

        const numActors = game.actors.size;
        const numItems = game.items.size;
        const finalUpdateProgress = 5;
        const DhProgress = game.system.api.applications.ui.DhProgress;
        const preRunProgress = game.packs.size;
        
        const progress = DhProgress.createMigrationProgress(
            preRunProgress + numActors + numItems + finalUpdateProgress
        );

        // Preload. Avoid hardcoding in the future
        for (const pack of game.packs) {
            await pack.getDocuments();
            progress.advance();
        }

        const batch = [];

        const updateItem = async item => {
            const itemUpdates = [];
            for (const effect of item.effects) {
                const changes = await this.updateActiveEffectSource(effect.toObject(), item);
                if (changes) itemUpdates.push(changes);
            }
            if (itemUpdates.length) {
                batch.push({
                    action: 'update',
                    documentName: 'ActiveEffect',
                    updates: itemUpdates,
                    parent: item
                });
            }
        };

        for (const actor of game.actors) {
            for (const item of actor.items) {
                await updateItem(item);
            }
            progress.advance();
        }
        for (const item of game.items) {
            await updateItem(item);
            progress.advance();
        }

        await foundry.documents.modifyBatch(batch);
        progress.advance({ by: finalUpdateProgress });
    }
}