export async function updateItemFeatures(document, changes, key, featureListFn) {
    // Store final data. A batch update is made from this at the end
    // keepId is on at the end, so id references are safe
    const finalCreateData = [];
    const removedEffectIds = [];

    const changedFeatures = changes.system[key] ?? [];
    const removedFeatures = document.system[key].filter(x => changedFeatures.every(y => y.value !== x.value));
    const added = changedFeatures.filter(x => document.system[key].every(y => y.value !== x.value));
    removedEffectIds.push(...removedFeatures.flatMap(f => f.effectIds ?? []).filter(id => document.effects.has(id)));

    // Determine what to remove
    const actionIds = removedFeatures.flatMap(f => f.actionIds ?? []);
    if (actionIds.length) {
        changes.system.actions = actionIds.reduce((acc, id) => {
            acc[id] = _del;
            return acc;
        }, {});
    }

    // Store a list of existing Ids. These are used to attempt to keep ids but ensure uniqueness
    const existingIds = new Set(document.effects.map(e => e._id).filter(e => !removedEffectIds.includes(e._id)));

    const allFeatures = featureListFn();
    for (const feature of added) {
        const featureData = foundry.utils.deepClone(allFeatures[feature.value]);

        // Add top level effects
        if (featureData.effects?.length > 0) {
            const effectsToAdd = featureData.effects.map(effect => ({
                ...effect,
                _id: effect._id && !existingIds.has(effect._id) ? effect._id : foundry.utils.randomID(),
                name: _loc(effect.name),
                description: _loc(effect.description)
            }));
            feature.effectIds = effectsToAdd.map(x => x._id);

            // Add to final list
            finalCreateData.push(...effectsToAdd);
        }

        // Add actions and effects from actions
        const newActions = {};
        if (featureData.actions?.length > 0 || featureData.actions?.size > 0) {
            for (const action of featureData.actions) {
                const effectsToAdd = (action.effects ?? []).map(effect => ({
                    ...effect,
                    transfer: false,
                    _id: effect._id && !existingIds.has(effect._id) ? effect._id : foundry.utils.randomID(),
                    name: _loc(effect.name),
                    description: _loc(effect.description)
                }));
                feature.effectIds.push(...effectsToAdd.map(x => x._id));

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
                        effects: effectsToAdd.map(x => ({ _id: x._id })),
                        systemPath: 'actions'
                    },
                    { parent: document.system }
                );
            
                // Add to final list
                finalCreateData.push(...effectsToAdd);
            }
        }

        changes.system.actions = newActions;
        feature.actionIds = Object.keys(newActions);
    }
        
    /** @type {foundry.abstract.types.DatabaseWriteOperation[]} */
    const aeBatch = [];
    if (removedEffectIds.length) {
        aeBatch.push({ 
            action: 'delete',
            documentName: 'ActiveEffect',
            parent: document,
            pack: document.pack,
            ids: removedEffectIds
        });
    }
    if (finalCreateData.length) {
        aeBatch.push({
            action: 'create',
            documentName: 'ActiveEffect',
            parent: document,
            pack: document.pack,
            keepId: true,
            data: finalCreateData
        });
    }
    
    await foundry.documents.modifyBatch(aeBatch);
}