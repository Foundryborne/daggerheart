export async function updateItemFeatures(document, changes, key, featureListFn) {
    const changedFeatures = changes.system[key] ?? [];
    const removedFeatures = document.system[key].filter(x => changedFeatures.every(y => y.value !== x.value));
    const added = changedFeatures.filter(x => document.system[key].every(y => y.value !== x.value));

    const effectIds = removedFeatures.flatMap(f => f.effectIds ?? []).filter(id => document.effects.has(id));
    const actionIds = removedFeatures.flatMap(f => f.actionIds ?? []);
    await document.deleteEmbeddedDocuments('ActiveEffect', effectIds);

    if (actionIds.length) {
        changes.system.actions = actionIds.reduce((acc, id) => {
            acc[id] = _del;
            return acc;
        }, {});
    }

    const allFeatures = featureListFn();
    for (const feature of added) {
        const featureData = foundry.utils.deepClone(allFeatures[feature.value]);
        if (featureData.effects?.length > 0) {
            const embeddedItems = await document.createEmbeddedDocuments(
                'ActiveEffect',
                featureData.effects.map(effect => ({
                    ...effect,
                    name: game.i18n.localize(effect.name),
                    description: game.i18n.localize(effect.description)
                }))
            );
            feature.effectIds = embeddedItems.map(x => x.id);
        }

        const newActions = {};
        if (featureData.actions?.length > 0 || featureData.actions?.size > 0) {
            for (const action of featureData.actions) {
                const embeddedEffects = await document.createEmbeddedDocuments(
                    'ActiveEffect',
                    (action.effects ?? []).map(effect => ({
                        ...effect,
                        transfer: false,
                        name: game.i18n.localize(effect.name),
                        description: game.i18n.localize(effect.description)
                    }))
                );
                feature.effectIds = [...(feature.effectIds ?? []), ...embeddedEffects.map(x => x.id)];

                const cls = game.system.api.models.actions.actionsTypes[action.type];
                const actionId = foundry.utils.randomID();
                newActions[actionId] = new cls(
                    {
                        ...cls.getSourceConfig(document.system),
                        ...action,
                        type: action.type,
                        _id: actionId,
                        name: game.i18n.localize(action.name),
                        description: game.i18n.localize(action.description),
                        effects: embeddedEffects.map(x => ({ _id: x.id })),
                        systemPath: 'actions'
                    },
                    { parent: document.system }
                );
            }
        }

        changes.system.actions = newActions;
        feature.actionIds = Object.keys(newActions);
    }
}