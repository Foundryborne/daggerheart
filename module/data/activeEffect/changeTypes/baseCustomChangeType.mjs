export default class BaseCustomChange extends foundry.abstract.DataModel {
    constructor(data, { single = true, ...options } = {}) {
        super(data, options);

        Object.defineProperty(this, 'single', {
            value: single,
            writable: false,
            enumerable: false
        });
    }
}