/** 
 * @typedef FeatureGroup
 * @property {DHItem} feature
 * @property {FeatureGroup[]} childFeatures
 */

/**
 * Prepares function context for sheet preparation reasons. 
 * This is also required for embeds, and is relegated to a helper as a result.
 * Since this is merely organizing top level and child features, this should become data prep at some point
 * @param {DhpActor} actor 
 * @returns {FeatureGroup[]}
 */
export function prepareFeatureData(actor) {
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

    return featureData;
}

/**
 * Does certain pre enrich replacements for embed uses.
 * @param {string} value the pre-enrich string to simplify 
 * @returns {string} the simplified string
 */
export function simplifyDescriptionForEmbed(value) {
    // Currently only replaces standalone lines with certain embed types
    return value.replaceAll(/<p>@(Template|Effect|UUID)\[([^[\]]*)\](?:{([^}]*)})?<\/p>/g, '')
}