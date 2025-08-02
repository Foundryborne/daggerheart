import DHBaseAction from './baseAction.mjs';

export default class DHEffectAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'effects', 'target'];
}
