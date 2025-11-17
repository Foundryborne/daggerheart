import DHBaseAction from './baseAction.mjs';

export default class DhCountdownAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'countdown'];

    get defaultValues() {
        return {
            ...super.defaultValues,
            countdown: {
                name: this.parent.parent.name,
                img: this.img
            }
        };
    }
}
