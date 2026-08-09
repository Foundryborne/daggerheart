import DHBaseAction from './baseAction.mjs';

export default class DHEvolutionAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'evolution', 'effects'];
}
