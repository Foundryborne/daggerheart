import DHBaseAction from './baseAction.mjs';

export default class DHSummonAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'summon'];
}
