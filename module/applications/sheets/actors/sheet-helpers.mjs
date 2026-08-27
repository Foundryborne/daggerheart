/**
 * Prepares function context for sheet preparation reasons. This is also required for embeds, and is relegated to a helper as a result
 * @param {DhpActor} actor 
 * @returns {Promise<{ features: unknown[]; evolutionFeatures: unknown[] }>}
 */
export function prepareFeatureContext(actor) {
    const featureForms = Object.keys(CONFIG.DH.ITEM.featureForm);
    const featureData = actor.system.features.sort((a, b) =>
        a.system.featureForm !== b.system.featureForm
            ? featureForms.indexOf(a.system.featureForm) - featureForms.indexOf(b.system.featureForm)
            : a.sort - b.sort
    ).map(feature => ({ feature, childFeatures: [] }));

    const { evolved } = CONFIG.DH.ACTIONS.evolutionStates;
    for (const { feature, childFeatures } of featureData) {
        if (feature.system.featureForm === 'evolution') {
            const evolutionActions = 
                feature.system.actions.filter(x => x.type === CONFIG.DH.ACTIONS.actionTypes.evolution.id);
            for (const action of evolutionActions) {
                for (const [id, featureState] of Object.entries(action.evolution.evolutionFeatures)) {
                    const evolutionFeature = featureData.find(x => x.feature.id === id);
                    if (!evolutionFeature) continue;

                    if (featureState === evolved.id) {
                        childFeatures.push(evolutionFeature);
                        featureData.splice(featureData.indexOf(evolutionFeature), 1);
                    }
                }
            }
        }
    }

    const context = {};
    context.features = [];
    context.evolutionFeatures = [];
    for (const { feature, childFeatures } of featureData) {
        if (childFeatures.length) {
            context.evolutionFeatures.push(feature);
        } else {
            context.features.push(feature);
        }

        for (const data of childFeatures) {
            context.evolutionFeatures.push(data.feature);
        }
    }

    return context;
}

/**
 * Prepares data for feature embeds, which are a variant of sheet helpers.
 * @param {DhpActor} actor 
 * @param {object} [options] 
 * @returns {Promise<object[][]}>}
 */
export async function prepareFeatureEmbedContext(actor, options = {}) {
    if (!actor.system.features) return {};

    const { TextEditor } = foundry.applications.ux;
    const context = await prepareFeatureContext(actor);
    const sections = [];
    for (const prop of ['features', 'evolutionFeatures']) {
        if (!context[prop]?.length) continue;
        const value = await Promise.all(context[prop].map(async f => ({
            name: f.name,
            featureForm: _loc(CONFIG.DH.ITEM.featureForm[f.system.featureForm]),
            description: await TextEditor.implementation.enrichHTML(f.system.description, {
                secrets: true,
                relativeTo: actor,
                rollData: f.getRollData(),
                ...options
            })
        })));
        sections.push(value);
    }
    return sections;
}
