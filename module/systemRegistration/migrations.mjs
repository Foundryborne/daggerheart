export async function runMigrations() {
    let lastMigrationVersion = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion);
    if (!lastMigrationVersion) lastMigrationVersion = '1.0.6';

    if (foundry.utils.isNewerVersion('1.1.0', lastMigrationVersion)) {
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

    if (foundry.utils.isNewerVersion('1.1.1', lastMigrationVersion)) {
        const compendiumClasses = [];
        const compendiumActors = [];
        for (let pack of game.packs) {
            const documents = await pack.getDocuments();
            compendiumClasses.push(...documents.filter(x => x.type === 'class'));
            compendiumActors.push(...documents.filter(x => x.type === 'character'));
        }

        [...compendiumActors, ...game.actors.filter(x => x.type === 'character')].forEach(char => {
            const multiclass = char.items.find(x => x.type === 'class' && x.system.isMulticlass);
            const multiclassSubclass = multiclass.system.subclasses.length > 0 ? multiclass.system.subclasses[0] : null;
            char.items.forEach(item => {
                if (item.type === 'feature' && item.system.identifier === 'multiclass') {
                    const base = item.system.originItemType === 'class' ? multiclass : multiclassSubclass;
                    if (base) {
                        const baseFeature = base.system.features.find(x => x.item.name === item.name);
                        if (baseFeature) {
                            item.update({
                                system: {
                                    multiclassOrigin: true,
                                    identifier: baseFeature.type
                                }
                            });
                        }
                    }
                }
            });
        });

        const worldClasses = game.items.filter(x => x.type === 'class');
        for (let classVal of [...compendiumClasses, ...worldClasses]) {
            for (let subclass of classVal.system.subclasses) {
                await subclass.update({ 'system.linkedClass': classVal.uuid });
            }
        }

        lastMigrationVersion = '1.1.1';
    }

    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion, lastMigrationVersion);
}
