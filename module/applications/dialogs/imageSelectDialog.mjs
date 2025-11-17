const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ImageSelectDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(titleName, images) {
        super();

        this.titleName = titleName;
        this.images = images;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'image-select'],
        position: {
            width: 612,
            height: 'auto'
        },
        window: {
            icon: 'fa-solid fa-paw'
        },
        actions: {
            selectImage: ImageSelectDialog.#selectImage,
            finishSelection: ImageSelectDialog.#finishSelection
        }
    };

    get title() {
        return this.titleName;
    }

    /** @override */
    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/dialogs/image-select/main.hbs',
            scrollable: ['.images-container']
        },
        footer: { template: 'systems/daggerheart/templates/dialogs/image-select/footer.hbs' }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.images = this.images;
        context.selectedImage = this.selectedImage;

        return context;
    }

    static #selectImage(_event, button) {
        this.selectedImage = button.dataset.image ?? button.querySelector('img').dataset.image;
        this.render();
    }

    static #finishSelection() {
        this.close({ submitted: true });
    }

    async close(options = {}) {
        if (!options.submitted) this.selectedImage = null;

        await super.close();
    }

    static async configure(title, images) {
        return new Promise(resolve => {
            const app = new this(title, images);
            app.addEventListener('close', () => resolve(app.selectedImage), { once: true });
            app.render({ force: true });
        });
    }
}
