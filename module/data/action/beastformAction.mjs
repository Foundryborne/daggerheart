import DHBaseAction from './baseAction.mjs';

export default class DhBeastformAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'beastform'];
}
