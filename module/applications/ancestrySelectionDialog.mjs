const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class AncestrySelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve) {
        super({});

        this.resolve = resolve;
        this.data = {
            ancestries: [],
            features: [],
            ancestryInfo: {
                name: '',
                img: null,
                customImg: 'icons/svg/mystery-man.svg',
                description: ''
            }
        };
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'ancestry-selection'],
        position: {
            width: 800,
            height: 'auto'
        },
        actions: {
            selectAncestry: this.selectAncestry,
            selectFeature: this.selectFeature,
            viewItem: this.viewItem,
            selectImage: this.selectImage,
            editImage: this._onEditImage,
            saveAncestry: this.saveAncestry
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    /** @override */
    static PARTS = {
        damageSelection: {
            id: 'ancestrySelection',
            template: 'systems/daggerheart/templates/views/ancestrySelection.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return `Ancestry Selection`;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        const ancestryNameInput = $(htmlElement).find('.ancestry-name');
        if (ancestryNameInput.length > 0) {
            ancestryNameInput.on('change', this.setName.bind(this));
            $(htmlElement).find('.ancestry-description').on('change', this.setDescription.bind(this));
        }
        // $(htmlElement).find(".ancestry-image").on("change", this.selectImage.bind(this));
    }

    async _prepareContext(_options) {
        const systemAncestries = Array.from((await game.packs.get('daggerheart.ancestries')).index).map(x => ({
            ...x,
            selected: this.data.ancestries.some(selected => selected.uuid === x.uuid)
        }));

        const customAncestries = game.items.reduce((acc, x) => {
            if (x.type === 'ancestry') {
                acc.push({
                    ...x,
                    uuid: x.uuid,
                    selected: this.data.ancestries.some(selected => selected.uuid === x.uuid)
                });
            }

            return acc;
        }, []);

        const ancestryFeatures = this.data.ancestries.flatMap(x =>
            x.system.abilities.map(x => ({
                ...x,
                selected: this.data.features.some(selected => selected.uuid === x.uuid)
            }))
        );

        return {
            systemAncestries,
            customAncestries,
            ancestryFeatures,
            selectedAncestries: this.data.ancestries,
            selectedFeatures: this.data.features,
            ancestryInfo: this.data.ancestryInfo
        };
    }

    static async selectAncestry(_, button) {
        const newAncestries = [...this.data.ancestries];
        if (!newAncestries.findSplice(x => x.uuid === button.dataset.uuid) && this.data.ancestries.length < 2) {
            const ancestry = await fromUuid(button.dataset.uuid);
            newAncestries.push(ancestry);
        }

        this.data.ancestries = newAncestries;
        this.data.features = newAncestries.length === 1 ? newAncestries[0].system.abilities : [];

        this.render(true);
    }

    static async selectFeature(_, button) {
        const newFeatures = [...this.data.features];
        if (!newFeatures.findSplice(x => x.uuid === button.dataset.uuid) && this.data.features.length < 2) {
            const feature = await fromUuid(button.dataset.uuid);
            newFeatures.push(feature);
        }

        this.data.features = newFeatures;
        this.render(true);
    }

    static async viewItem(_, button) {
        (await fromUuid(button.dataset.uuid)).sheet.render(true);
    }

    setName(event) {
        this.data.ancestryInfo.name = event.currentTarget.value;
        this.render(true);
    }

    setDescription(event) {
        this.data.ancestryInfo.description = event.currentTarget.value;
        this.render(true);
    }

    static selectImage(_, button) {
        this.data.ancestryInfo.img = button.dataset.img;
        this.render(true);
    }

    static _onEditImage() {
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current: this.data.ancestryInfo.img,
            type: 'image',
            redirectToRoot: ['icons/svg/mystery-man.svg'],
            callback: async path => this._updateImage.bind(this)(path),
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    _updateImage(path) {
        this.data.ancestryInfo.customImg = path;
        this.data.ancestryInfo.img = path;
        this.render(true);
    }

    static async saveAncestry(_, button) {
        if (this.data.ancestries.length === 2) {
            const { name, img, description } = this.data.ancestryInfo;

            this.resolve({
                data: {
                    name: name,
                    img: img,
                    type: 'ancestry',
                    system: {
                        description: description,
                        abilities: this.data.features.map(x => ({
                            name: x.name,
                            img: x.img,
                            uuid: x.uuid,
                            subclassLevel: ''
                        }))
                    }
                }
            });
        } else {
            this.resolve({ data: this.data.ancestries[0].toObject() });
        }

        this.close();
    }
}

// export default class DamageSelectionDialog extends FormApplication {
//     constructor(rollString, bonusDamage, resolve){
//         super({}, {});

//         this.data = {
//             rollString,
//             bonusDamage: bonusDamage.map(x => ({
//                 ...x,
//                 hopeUses: 0
//             })),
//         }
//         this.resolve = resolve;
//     }

//     get title (){
//       return 'Damage Options';
//     }

//     static get defaultOptions() {
//         const defaults = super.defaultOptions;
//         const overrides = {
//           height: 'auto',
//           width: 400,
//           id: 'damage-selection',
//           template: 'systems/daggerheart/templates/views/damageSelection.hbs',
//           closeOnSubmit: false,
//           classes: ["daggerheart", "views", "damage-selection"],
//         };

//         const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

//         return mergedOptions;
//     }

//     async getData(){
//         const context = super.getData();
//         context.rollString = this.data.rollString;
//         context.bonusDamage = this.data.bonusDamage;

//         return context;
//     }

//     activateListeners(html) {
//         super.activateListeners(html);

//         html.find('.roll-button').click(this.finish.bind(this));
//         html.find('.').change();
//     }

//     // async _updateObject(_, formData) {
//     //     const data = foundry.utils.expandObject(formData);
//     //     this.data = foundry.utils.mergeObject(this.data, data);
//     //     this.render(true);
//     // }

//     finish(){
//       this.resolve(this.data);
//       this.close();
//     }
//   }
