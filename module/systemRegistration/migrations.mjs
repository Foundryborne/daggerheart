import { defaultRestOptions } from '../config/generalConfig.mjs';
import { RefreshType, socketEvent } from './socket.mjs';

export async function runMigrations() {
    let lastMigrationVersion = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion);
    if (!lastMigrationVersion) lastMigrationVersion = game.system.version;

    //#region old migrations
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

    if (foundry.utils.isNewerVersion('1.2.7', lastMigrationVersion)) {
        const tagTeam = game.settings.get(CONFIG.DH.id, 'TagTeamRoll');
        const initatorMissing = tagTeam.initiator && !game.actors.some(actor => actor.id === tagTeam.initiator);
        const missingMembers = Object.keys(tagTeam.members).reduce((acc, id) => {
            if (!game.actors.some(actor => actor.id === id)) {
                acc[id] = _del;
            }
            return acc;
        }, {});

        await tagTeam.updateSource({
            initiator: initatorMissing ? null : tagTeam.initiator,
            members: missingMembers
        });
        await game.settings.set(CONFIG.DH.id, 'TagTeamRoll', tagTeam);

        lastMigrationVersion = '1.2.7';
    }

    if (foundry.utils.isNewerVersion('1.5.5', lastMigrationVersion)) {
        /* Clear out Environments that were added directly from compendium */
        for (const scene of game.scenes) {
            if (!scene.flags.daggerheart) continue;
            const systemData = new game.system.api.data.scenes.DHScene(scene.flags.daggerheart);
            const sceneEnvironments = systemData.sceneEnvironments;

            const newEnvironments = sceneEnvironments.filter(x => !x?.pack);
            if (newEnvironments.length !== sceneEnvironments.length)
                await scene.update({ 'flags.daggerheart.sceneEnvironments': newEnvironments });
        }

        ui.nav.render(true);

        lastMigrationVersion = '1.5.5';
    }

    if (foundry.utils.isNewerVersion('1.6.0', lastMigrationVersion)) {
        /* Delevel any companions that are higher level than their partner character */
        for (const companion of game.actors.filter(x => x.type === 'companion')) {
            if (companion.system.levelData.level.current <= 1) continue;

            if (!companion.system.partner) {
                await companion.updateLevel(1);
            } else {
                const endLevel = companion.system.partner.system.levelData.level.current;
                if (endLevel < companion.system.levelData.level.current) {
                    companion.system.levelData.level.changed = companion.system.levelData.level.current;
                    await companion.updateLevel(endLevel);
                }
            }
        }

        lastMigrationVersion = '1.6.0';
    }

    if (foundry.utils.isNewerVersion('2.0.0', lastMigrationVersion)) {
        const progress = game.system.api.applications.ui.DhProgress.createMigrationProgress(0);
        const progressBuffer = 50;

        //#region Data Setup
        const lockedPacks = [];
        const itemPacks = game.packs.filter(x => x.metadata.type === 'Item');
        const actorPacks = game.packs.filter(x => x.metadata.type === 'Actor');

        const getIndexes = async (packs, type) => {
            const indexes = [];
            for (const pack of packs) {
                const indexValues = pack.index.values().reduce((acc, index) => {
                    if (!type || index.type === type) acc.push(index.uuid);
                    return acc;
                }, []);

                if (indexValues.length && pack.locked) {
                    lockedPacks.push(pack.collection);
                    await pack.configure({ locked: false });
                }

                indexes.push(...indexValues);
            }

            return indexes;
        };

        const itemEntries = await getIndexes(itemPacks);
        const characterEntries = await getIndexes(actorPacks, 'character');

        const worldItems = game.items;
        const worldCharacters = game.actors.filter(x => x.type === 'character');

        /* The async fetches are the mainstay of time. Leaving 1 progress for the sync logic */
        const newMax = itemEntries.length + characterEntries.length + progressBuffer;
        progress.updateMax(newMax);

        const compendiumItems = [];
        for (const entry of itemEntries) {
            const item = await foundry.utils.fromUuid(entry);
            compendiumItems.push(item);
            progress.advance();
        }

        const compendiumCharacters = [];
        for (const entry of characterEntries) {
            const character = await foundry.utils.fromUuid(entry);
            compendiumCharacters.push(character);
            progress.advance();
        }
        //#endregion

        /* Migrate existing effects modifying armor, creating new Armor Effects instead */
        const migrateEffects = async entity => {
            for (const effect of entity.effects) {
                if (effect.system.changes.every(x => x.key !== 'system.armorScore')) continue;

                effect.update({
                    'system.changes': effect.system.changes.map(change => ({
                        ...change,
                        type: change.key === 'system.armorScore' ? 'armor' : change.type,
                        value: change.key === 'system.armorScore' ? { current: 0, max: change.value } : change.value
                    }))
                });
            }
        };

        /* Migrate existing armors effects */
        const migrateItems = async items => {
            for (const item of items) {
                await migrateEffects(item);
            }
        };

        await migrateItems([...compendiumItems, ...worldItems]);
        progress.advance({ by: progressBuffer / 2 });

        for (const actor of [...compendiumCharacters, ...worldCharacters]) {
            await migrateEffects(actor);
            await migrateItems(actor.items);
        }

        progress.advance({ by: progressBuffer / 2 });

        for (let packId of lockedPacks) {
            const pack = game.packs.get(packId);
            await pack.configure({ locked: true });
        }

        progress.close();

        lastMigrationVersion = '2.0.0';
    }

    if (foundry.utils.isNewerVersion('2.0.4', lastMigrationVersion)) {
        const downtimeMoves = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew);
        if (downtimeMoves.restMoves.longRest.moves.repairArmor) {
            await downtimeMoves.updateSource({
                'restMoves.longRest.moves.repairArmor': defaultRestOptions.longRest().repairArmor
            });
            game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, downtimeMoves.toObject());
        }

        lastMigrationVersion = '2.0.4';
    }
    //#endregion

    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion, lastMigrationVersion);
}
