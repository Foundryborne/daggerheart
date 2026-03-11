import DHBaseAction from './baseAction.mjs';

export default class DHTransformAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'transform'];
}
