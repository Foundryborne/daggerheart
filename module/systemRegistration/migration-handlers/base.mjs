/** 
 * The base class of an async migration. 
 * These are generally run between versions for things that require compendiums or must be done in post.
 * The migrate() functions calls the various updateXSource() functions.
 * Generally a subclass will override the version and the updateXSource() functions.
 */
export class MigrationHandlerBase {
    version = null;

    async migrate() {
        // todo: handle migrations, but have a way for a migration handler to specify if migrations are handled
        // todo: handle more than just migrating effects. Right now this can only migrate effects
        // NOTE: the preload is hardcoded, we should not hardcode it

        // note: last update costs as 5 on the progress
        const numActors = game.actors.length;
        const numItems = game.items.length;
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
                const changes = await this.updateEffectSource(effect.toObject(), effect.parent);
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