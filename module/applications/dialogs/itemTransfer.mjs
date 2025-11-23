const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class ItemTransferDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item) {
        super({});

        this.item = item;
        this.quantity = item.system.quantity;
    }

    get title() {
        return this.item.name;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'item-transfer'],
        position: { width: 300, height: 'auto' },
        window: { icon: 'fa-solid fa-hand-holding-hand' },
        actions: {
            finish: ItemTransferDialog.#finish
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        main: { template: 'systems/daggerheart/templates/dialogs/item-transfer.hbs' }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelector('.number-display').addEventListener('change', event => {
            this.quantity = isNaN(event.target.value) ? this.quantity : Number(event.target.value);
            this.render();
        });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.item = this.item;
        context.quantity = this.quantity;

        return context;
    }

    static async updateData(_event, _element, formData) {
        const { quantity } = foundry.utils.expandObject(formData.object);
        this.quantity = quantity;
        this.render();
    }

    static async #finish() {
        this.close({ submitted: true });
    }

    close(options = {}) {
        if (!options.submitted) this.quantity = null;

        super.close();
    }

    static async configure(item) {
        return new Promise(resolve => {
            const app = new this(item);
            app.addEventListener('close', () => resolve(app.quantity), { once: true });
            app.render({ force: true });
        });
    }
}
