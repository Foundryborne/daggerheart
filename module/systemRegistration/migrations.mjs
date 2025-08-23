import { versionCompare } from '../helpers/utils.mjs';

export async function runMigrations() {
    let lastMigrationVersion = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion);
    if (!lastMigrationVersion) lastMigrationVersion = '1.0.6';

    if (versionCompare(lastMigrationVersion, '1.1.0')) {
        const compendiumActors = [];
        for (let pack of game.packs) {
            const documents = await pack.getDocuments();
            compendiumActors.push(...documents.filter(x => x.type === 'character'));
        }

        [...compendiumActors, ...game.actors].forEach(actor => {
            const items = actor.items.reduce((acc, item) => {
                if (item.type === 'feature') {
                    const { originItemType, isMulticlass, identifier } = item.system;
                    const base = originItemType
                        ? actor.items.find(
                              x => x.type === originItemType && Boolean(isMulticlass) === Boolean(x.system.isMulticlass)
                          )
                        : null;
                    if (base) {
                        const feature = base.system.features.find(x => x.item && x.item.uuid === item.uuid);
                        if (feature && identifier !== 'multiclass') {
                            acc.push({ _id: item.id, system: { identifier: feature.type } });
                        }
                    }
                }

                return acc;
            }, []);

            actor.updateEmbeddedDocuments('Item', items);
        });

        lastMigrationVersion = '1.1.0';
    }

    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion, lastMigrationVersion);
}
