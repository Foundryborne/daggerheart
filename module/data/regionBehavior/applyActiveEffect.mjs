export default class DhApplyActiveEffect extends CONFIG.RegionBehavior.dataModels.applyActiveEffect {
    static #tokenDispositionChecker = (eventFunction) => (event) => {
        const { token } = event.data;
        if (token.disposition === -1) {
            eventFunction.bind(this)(event);
        }
    } 

    /** @override */
    static events = Object.entries(super.events).reduce((acc, [key, func]) => {
        acc[key] = DhApplyActiveEffect.#tokenDispositionChecker(func);
        return acc;
    }, {});
} 