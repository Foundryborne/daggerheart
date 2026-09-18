/** 
 * @import DHItem from "../../documents/item.mjs";
* @import DhActor from "../../documents/actor.mjs";
 */
/** 

 * The base class of an async migration. 
 * These are generally run between versions for things that require compendiums or must be done in post.
 * The migrate() functions calls the various updateXSource() functions.
 * Generally a subclass will override the version and the updateXSource() functions.
 */
export class MigrationHandlerBase {
    /** System version that introduces this migration */
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

    /**
     * Update a world actor
     * @param {DhActor} actor 
     * @returns {Promise<object>}
     * @protected
     */
    async updateActorSource(actor) {
        return null;
    }

    /**
     * Update a world item
     * @param {DhActor} actor 
     * @returns {Promise<object>}
     * @protected
     */
    async updateItemSource(item) {
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
            const itemUpdate = await this.updateItemSource(item);
            if (itemUpdate) {
                batch.push(...this.#processEffectUpdates(item, itemUpdate));
                const itemAction = {
                    action: 'update',
                    documentName: 'Item',
                    updates: [itemUpdate],
                    parent: item.parent,
                    pack: item.pack
                };
                batch.push(itemAction);
            }

            const effectUpdates = [];
            for (const effect of item.effects) {
                const changes = await this.updateActiveEffectSource(effect.toObject(), item);
                if (changes) effectUpdates.push(changes);
            }
            if (effectUpdates.length) {
                batch.push({
                    action: 'update',
                    documentName: 'ActiveEffect',
                    updates: effectUpdates,
                    parent: item,
                    pack: item.pack
                });
            }
        };

        const updateActor = async actor => {
            const actorUpdate = await this.updateActorSource(actor);
            if (actorUpdate) {
                batch.push(...this.#processEffectUpdates(actor, actorUpdate));
                batch.push({
                    action: 'update',
                    documentName: 'Actor',
                    updates: [actorUpdate],
                    parent: actor.parent,
                    pack: actor.pack
                });
            }

            const aeUpdates = [];
            for (const item of actor.items) {
                await updateItem(item);
            }
            
            for (const effect of actor.effects) {
                const changes = await this.updateActiveEffectSource(effect.toObject(), { parent: actor });
                if (changes) aeUpdates.push(changes);
            }
            if (aeUpdates.length) {
                batch.push({
                    action: 'update',
                    documentName: 'ActiveEffect',
                    updates: aeUpdates,
                    parent: actor,
                    pack: actor.pack
                });
            }
        }

        for (const actor of game.actors) {
            await updateActor(actor);
  
            progress.advance();
        }
        for (const item of game.items) {
            await updateItem(item);
            progress.advance();
        }

        await foundry.documents.modifyBatch(batch);
        progress.advance({ by: finalUpdateProgress });
    }

    #processEffectUpdates(actorOrItem, update) {
        if (!update.effects) return [];
        const batch = [];
        const idsInUpdate = update.effects.map(e => e._id);
        const toDelete = actorOrItem.effects.filter(e => !idsInUpdate.includes(e._id));
        const toCreate = update.effects.filter(e => !actorOrItem.effects.has(e._id));
        const toUpdate = update.effects.filter(e => actorOrItem.effects.has(e._id));
        if (toDelete.length) {
            batch.push({
                action: 'delete',
                documentName: 'ActiveEffect',
                parent: actorOrItem,
                pack: actorOrItem.pack,
                ids: toDelete.map(e => e._id)
            });
        }
        if (toCreate.length) {
            batch.push({
                action: 'create',
                documentName: 'ActiveEffect',
                parent: actorOrItem,
                pack: actorOrItem.pack,
                data: toCreate
            });
        }
        if (toUpdate.length) {
            batch.push({
                action: 'update',
                documentName: 'ActiveEffect',
                parent: actorOrItem,
                pack: actorOrItem.pack,
                updates: toUpdate
            });
        }
        delete update.effects;
        return batch;
    }
}