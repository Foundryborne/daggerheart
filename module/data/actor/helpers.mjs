import { pickBy } from '../../helpers/functional.mjs';

/* Can be generalized to work on other data paths handling adding/removing features if there's a need */
export async function updateSubTypes(document, changes) {
    // Check that subTypes was changed. Note that having a config will lead to this being called twice,
    // however due to the diffing that should be fine
    if (!changes.system.subTypes) return;

    // Store final data. A batch update is made from this at the end
    // keepId is on at the end, so id references are safe
    const featureCreateData = [];
    const featureRemoveData = [];

    const changedSubTypes = foundry.utils.mergeObject(
        document.toObject(true).system.subTypes,
        changes.system.subTypes,
        { applyOperators: true }
    );
    const existingSubTypes = document.system.subTypes;
    const removedSubTypes = Object.values(existingSubTypes).filter(f => !(f.value.value in changedSubTypes));
    const addedSubTypes = Object.values(pickBy(changes.system.subTypes, (_, k) => !(k in existingSubTypes)));

    for (const subType of removedSubTypes) {
        featureRemoveData.push(...(subType.featureIds ?? []));
    }

    for (const subType of addedSubTypes) {
        subType.featureIds ??= [];
        const data = CONFIG.DH.ACTOR.adversarySubTypes[subType.value] ? 
            foundry.utils.deepClone(CONFIG.DH.ACTOR.adversarySubTypes[subType.value]) : null;
        for (const feature of data?.features ?? []) {
            const { actions, ...featureData } = feature;
            featureData.effects ??= [];
            featureData.system.actions ??= {}; 

            for (const action of actions) {
                const effectsToAdd = (action.effects ?? []).map(effect => ({
                    ...effect,
                    transfer: false,
                    _id: effect._id || foundry.utils.randomID(),
                    name: _loc(effect.name),
                    description: _loc(effect.description)
                }));

                const cls = game.system.api.models.actions.actionsTypes[action.type];
                const actionId = foundry.utils.randomID();
                featureData.system.actions[actionId] = new cls(
                    {
                        ...cls.getSourceConfig(document.system),
                        ...action,
                        type: action.type,
                        _id: actionId,
                        name: _loc(action.name),
                        description: _loc(action.description),
                        effects: effectsToAdd.map(x => ({ _id: x._id })),
                        systemPath: 'actions'
                    },
                    { parent: document.system }
                );
                
                featureData.effects.push(...effectsToAdd);
            }

            const featureId = foundry.utils.randomID();
            subType.featureIds.push(featureId);
            featureCreateData.push({
                ...featureData,
                _id: featureId,
                type: 'feature',
                name: _loc(featureData.name),
                system: {
                    ...(featureData.system ?? {}),
                    description: _loc(featureData.system?.description)
                }
            });
        }
    }

    const aeBatch = [];
    if (featureRemoveData.length) {
        aeBatch.push({ 
            action: 'delete',
            documentName: 'Item',
            parent: document,
            pack: document.pack,
            ids: featureRemoveData
        });
    }
    if (featureCreateData.length) {
        aeBatch.push({
            action: 'create',
            documentName: 'Item',
            parent: document,
            pack: document.pack,
            keepId: true,
            data: featureCreateData
        });
    }
    
    await foundry.documents.modifyBatch(aeBatch);
}
