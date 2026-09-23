import DHBaseAction from './baseAction.mjs';

export default class DHGroupedAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'grouped'];
}
