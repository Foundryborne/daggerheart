import DHBaseAction from './baseAction.mjs';

export default class DHMacroAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'macro'];
}
