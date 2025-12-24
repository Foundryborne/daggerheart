const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class ItemTransferDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(data) {
        super({});
        this.data = data;
    }

    get title() {
        return this.data.title;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'item-transfer'],
        position: { width: 400, height: 'auto' },
        window: { icon: 'fa-solid fa-hand-holding-hand' },
        actions: {
            finish: ItemTransferDialog.#finish
        }
    };

    static PARTS = {
        main: { template: 'systems/daggerheart/templates/dialogs/item-transfer.hbs', root: true }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        return foundry.utils.mergeObject(context, this.data);
    }

    static async #finish() {
        this.selected = this.form.elements.quantity.valueAsNumber || null;
        this.close();
    }

    static #determineTransferOptions({ originActor, targetActor, item, currency }) {
        originActor ??= item?.actor;
        const homebrewKey = CONFIG.DH.SETTINGS.gameSettings.Homebrew;
        const currencySetting = game.settings.get(CONFIG.DH.id, homebrewKey).currency?.[currency] ?? null;

        return {
            originActor,
            targetActor,
            itemImage: item?.img,
            currencyIcon: currencySetting?.icon,
            max: item?.system.quantity ?? originActor.system.gold[currency] ?? 0,
            title: item?.name ?? currencySetting?.label
        };
    }

    static async configure(options) {
        return new Promise(resolve => {
            const data = this.#determineTransferOptions(options);
            if (data.max <= 1) return resolve(data.max);

            const app = new this(data);
            app.addEventListener('close', () => resolve(app.selected), { once: true });
            app.render({ force: true });
        });
    }
}
