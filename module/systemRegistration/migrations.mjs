import { RefreshType, socketEvent } from './socket.mjs';

export async function runMigrations() {
    let lastMigrationVersion = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion);
    if (!lastMigrationVersion) lastMigrationVersion = game.system.version;

    if (foundry.utils.isNewerVersion('1.1.0', lastMigrationVersion)) {
        const lockedPacks = [];
        const compendiumActors = [];
        for (let pack of game.packs) {
            if (pack.locked) {
                lockedPacks.push(pack.collection);
                await pack.configure({ locked: false });
            }
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

        for (let packId of lockedPacks) {
            const pack = game.packs.get(packId);
            await pack.configure({ locked: true });
        }

        lastMigrationVersion = '1.1.0';
    }

    if (foundry.utils.isNewerVersion('1.1.1', lastMigrationVersion)) {
        const lockedPacks = [];
        const compendiumClasses = [];
        const compendiumActors = [];
        for (let pack of game.packs) {
            if (pack.locked) {
                lockedPacks.push(pack.collection);
                await pack.configure({ locked: false });
            }
            const documents = await pack.getDocuments();
            compendiumClasses.push(...documents.filter(x => x.type === 'class'));
            compendiumActors.push(...documents.filter(x => x.type === 'character'));
        }

        [...compendiumActors, ...game.actors.filter(x => x.type === 'character')].forEach(char => {
            const multiclass = char.items.find(x => x.type === 'class' && x.system.isMulticlass);
            const multiclassSubclass =
                multiclass?.system?.subclasses?.length > 0 ? multiclass.system.subclasses[0] : null;
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

        for (let packId of lockedPacks) {
            const pack = game.packs.get(packId);
            await pack.configure({ locked: true });
        }

        lastMigrationVersion = '1.1.1';
    }

    if (foundry.utils.isNewerVersion('1.2.0', lastMigrationVersion)) {
        /* Migrate old action costs */
        const lockedPacks = [];
        const compendiumItems = [];
        for (let pack of game.packs) {
            if (pack.locked) {
                lockedPacks.push(pack.collection);
                await pack.configure({ locked: false });
            }
            const documents = await pack.getDocuments();

            compendiumItems.push(...documents.filter(x => x.system?.metadata?.hasActions));
            compendiumItems.push(
                ...documents
                    .filter(x => x.items)
                    .flatMap(actor => actor.items.filter(x => x.system?.metadata?.hasActions))
            );
        }

        const worldItems = game.items.filter(x => x.system.metadata.hasActions);
        const worldActorItems = Array.from(game.actors).flatMap(actor =>
            actor.items.filter(x => x.system.metadata.hasActions)
        );

        const validCostKeys = Object.keys(CONFIG.DH.GENERAL.abilityCosts);
        for (let item of [...worldItems, ...worldActorItems, ...compendiumItems]) {
            for (let action of item.system.actions) {
                const resourceCostIndexes = Object.keys(action.cost).reduce(
                    (acc, index) => (!validCostKeys.includes(action.cost[index].key) ? [...acc, Number(index)] : acc),
                    []
                );
                if (resourceCostIndexes.length === 0) continue;

                await action.update({
                    cost: action.cost.map((cost, index) => {
                        const { keyIsID, ...rest } = cost;
                        if (!resourceCostIndexes.includes(index)) return { ...rest };

                        return {
                            ...rest,
                            key: 'resource',
                            itemId: cost.key
                        };
                    })
                });
            }
        }

        for (let packId of lockedPacks) {
            const pack = game.packs.get(packId);
            await pack.configure({ locked: true });
        }

        /* Migrate old countdown structure */
        const countdownSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const getCountdowns = (data, type) => {
            return Object.keys(data.countdowns).reduce((acc, key) => {
                const countdown = data.countdowns[key];
                acc[key] = {
                    ...countdown,
                    type: type,
                    ownership: Object.keys(countdown.ownership.players).reduce((acc, key) => {
                        acc[key] =
                            countdown.ownership.players[key].type === 1 ? 2 : countdown.ownership.players[key].type;
                        return acc;
                    }, {}),
                    progress: {
                        ...countdown.progress,
                        type: countdown.progress.type.value
                    }
                };

                return acc;
            }, {});
        };

        await countdownSettings.updateSource({
            countdowns: {
                ...getCountdowns(countdownSettings.narrative, CONFIG.DH.GENERAL.countdownBaseTypes.narrative.id),
                ...getCountdowns(countdownSettings.encounter, CONFIG.DH.GENERAL.countdownBaseTypes.encounter.id)
            }
        });
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, countdownSettings);

        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data: { refreshType: RefreshType.Countdown }
        });
        Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });

        lastMigrationVersion = '1.2.0';
    }

    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion, lastMigrationVersion);
}
