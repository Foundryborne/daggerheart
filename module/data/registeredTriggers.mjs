export default class RegisteredTriggers extends Map {
    constructor() {
        super();
    }

    registerTriggers(triggers, actor, uuid) {
        for (const triggerKey of Object.keys(CONFIG.DH.TRIGGER.triggers)) {
            const match = triggers[triggerKey];
            const existingTrigger = this.get(triggerKey);

            if (!match) {
                if (existingTrigger?.get(uuid)) this.get(triggerKey).delete(uuid);
            } else {
                const { trigger, triggeringActorType, commands } = match;

                if (!existingTrigger) this.set(trigger, new Map());
                this.get(trigger).set(uuid, { actor, triggeringActorType, commands });
            }
        }
    }

    registerItemTriggers(item, registerOverride) {
        if (!item.actor || !item._stats.createdTime) return;
        for (const action of item.system.actions ?? []) {
            if (!action.actor) continue;

            /* Non actor-linked should only prep synthetic actors so they're not registering triggers unless they're on the canvas */
            if (
                !registerOverride &&
                !action.actor.prototypeToken.actorLink &&
                (!(action.actor.parent instanceof game.system.api.documents.DhToken) || !action.actor.parent?.uuid)
            )
                continue;

            const triggers = {};
            for (const trigger of action.triggers) {
                const { args } = CONFIG.DH.TRIGGER.triggers[trigger.trigger];
                const fn = new foundry.utils.AsyncFunction(...args, `{${trigger.command}\n}`);

                if (!triggers[trigger.trigger])
                    triggers[trigger.trigger] = {
                        trigger: trigger.trigger,
                        triggeringActorType: trigger.triggeringActorType,
                        commands: []
                    };
                triggers[trigger.trigger].commands.push(fn.bind(action));
            }

            this.registerTriggers(triggers, action.actor?.uuid, item.uuid);
        }
    }

    unregisterTriggers(triggerKeys, uuid) {
        for (const triggerKey of triggerKeys) {
            const existingTrigger = this.get(triggerKey);
            if (!existingTrigger) return;

            existingTrigger.delete(uuid);
        }
    }

    unregisterItemTriggers(items) {
        for (const item of items) {
            if (!item.system.actions?.size) continue;

            const triggers = (item.system.actions ?? []).reduce((acc, action) => {
                acc.push(...action.triggers.map(x => x.trigger));
                return acc;
            }, []);

            this.unregisterTriggers(triggers, item.uuid);
        }
    }

    unregisterSceneEnvironmentTriggers(flagSystemData) {
        const sceneData = new game.system.api.data.scenes.DHScene(flagSystemData);
        for (const environment of sceneData.sceneEnvironments) {
            if (environment.pack) continue;
            this.unregisterItemTriggers(environment.system.features);
        }
    }

    unregisterSceneTriggers(scene) {
        this.unregisterSceneEnvironmentTriggers(scene.flags.daggerheart);

        for (const triggerKey of Object.keys(CONFIG.DH.TRIGGER.triggers)) {
            const existingTrigger = this.get(triggerKey);
            if (!existingTrigger) continue;

            const filtered = new Map();
            for (const [uuid, data] of existingTrigger.entries()) {
                if (!uuid.startsWith(scene.uuid)) filtered.set(uuid, data);
            }
            this.set(triggerKey, filtered);
        }
    }

    registerSceneEnvironmentTriggers(flagSystemData) {
        const sceneData = new game.system.api.data.scenes.DHScene(flagSystemData);
        for (const environment of sceneData.sceneEnvironments) {
            for (const feature of environment.system.features) {
                if (feature) this.registerItemTriggers(feature, true);
            }
        }
    }

    registerSceneTriggers(scene) {
        this.registerSceneEnvironmentTriggers(scene.flags.daggerheart);

        for (const actor of scene.tokens.filter(x => x.actor).map(x => x.actor)) {
            if (actor.prototypeToken.actorLink) continue;

            for (const item of actor.items) {
                this.registerItemTriggers(item);
            }
        }
    }

    async runTrigger(trigger, currentActor, ...args) {
        const updates = [];
        const triggerSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).triggers;
        if (!triggerSettings.enabled) return updates;

        const dualityTrigger = this.get(trigger);
        if (dualityTrigger?.size) {
            const triggerActors = ['character', 'adversary', 'environment'];
            for (let [itemUuid, { actor: actorUuid, triggeringActorType, commands }] of dualityTrigger.entries()) {
                const actor = await foundry.utils.fromUuid(actorUuid);
                if (!actor || !triggerActors.includes(actor.type)) continue;

                const triggerData = CONFIG.DH.TRIGGER.triggers[trigger];
                if (triggerData.usesActor && triggeringActorType !== 'any') {
                    if (triggeringActorType === 'self' && currentActor?.uuid !== actorUuid) continue;
                    else if (triggeringActorType === 'other' && currentActor?.uuid === actorUuid) continue;
                }

                for (const command of commands) {
                    try {
                        if (CONFIG.debug.triggers) {
                            const item = await foundry.utils.fromUuid(itemUuid);
                            console.log(
                                game.i18n.format('DAGGERHEART.UI.ConsoleLogs.triggerRun', {
                                    actor: actor.name ?? '<Missing Actor>',
                                    item: item?.name ?? '<Missing Item>',
                                    trigger: game.i18n.localize(triggerData.label)
                                })
                            );
                        }

                        const result = await command(...args);
                        if (result?.updates?.length) updates.push(...result.updates);
                    } catch (_) {
                        const triggerName = game.i18n.localize(triggerData.label);
                        ui.notifications.error(
                            game.i18n.format('DAGGERHEART.CONFIG.Triggers.triggerError', {
                                trigger: triggerName,
                                actor: currentActor?.name
                            })
                        );
                    }
                }
            }
        }

        return updates;
    }
}
