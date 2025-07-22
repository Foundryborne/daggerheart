const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class BeastformDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(configData, item) {
        super();

        this.item = item;

        this.configData = configData;
        this.selected = null;
        this.evolved = { form: null };
        this.hybrid = { forms: {}, advantages: {}, features: {} };

        this._dragDrop = this._createDragDropHandlers();
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dialog', 'dh-style', 'beastform-selection'],
        position: {
            width: 600,
            height: 'auto'
        },
        window: {
            icon: 'fa-solid fa-paw'
        },
        actions: {
            selectBeastform: this.selectBeastform,
            toggleHybridFeature: this.toggleHybridFeature,
            toggleHybridAdvantage: this.toggleHybridAdvantage,
            submitBeastform: this.submitBeastform
        },
        form: {
            handler: this.updateBeastform,
            submitOnChange: true,
            submitOnClose: false
        },
        dragDrop: [{ dragSelector: '.beastform-container', dropSelector: '.advanced-form-container' }]
    };

    get title() {
        return this.item.name;
    }

    /** @override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/dialogs/beastform/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/dialogs/beastform/tabs.hbs' },
        beastformTier: { template: 'systems/daggerheart/templates/dialogs/beastform/beastformTier.hbs' },
        advanced: { template: 'systems/daggerheart/templates/dialogs/beastform/advanced.hbs' },
        footer: { template: 'systems/daggerheart/templates/dialogs/beastform/footer.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            initial: '1',
            labelPrefix: 'DAGGERHEART.GENERAL.Tiers'
        }
    };

    changeTab(tab, group, options) {
        super.changeTab(tab, group, options);

        this.render();
    }

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        this._dragDrop.forEach(d => d.bind(htmlElement));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.selected = this.selected;
        context.selectedBeastformEffect = this.selected?.effects?.find?.(x => x.type === 'beastform');

        context.evolved = this.evolved;

        context.hybridForms = Object.keys(this.hybrid.forms).reduce((acc, formKey) => {
            if (!this.hybrid.forms[formKey]) {
                acc[formKey] = null;
            } else {
                const data = this.hybrid.forms[formKey].toObject();
                acc[formKey] = {
                    ...data,
                    system: {
                        ...data.system,
                        features: this.hybrid.forms[formKey].system.features.map(feature => ({
                            ...feature.toObject(),
                            uuid: feature.uuid,
                            selected: Boolean(this.hybrid.features?.[formKey]?.[feature.uuid])
                        })),
                        advantageOn: Object.keys(data.system.advantageOn).reduce((acc, key) => {
                            acc[key] = {
                                ...data.system.advantageOn[key],
                                selected: Boolean(this.hybrid.advantages?.[formKey]?.[key])
                            };
                            return acc;
                        }, {})
                    }
                };
            }
            return acc;
        }, {});

        const maximumDragTier = Math.max(
            this.selected?.system?.evolved?.maximumTier ?? 0,
            this.selected?.system?.hybrid?.maximumTier ?? 0
        );

        const compendiumBeastforms = await game.packs.get(`daggerheart.beastforms`)?.getDocuments();
        const beastformTiers = [...(compendiumBeastforms ? compendiumBeastforms : []), ...game.items].reduce(
            (acc, x) => {
                const tier = CONFIG.DH.GENERAL.tiers[x.system.tier];
                if (x.type !== 'beastform' || tier.id > this.configData.tierLimit) return acc;

                if (!acc[tier.id]) acc[tier.id] = { label: game.i18n.localize(tier.label), values: {} };

                acc[tier.id].values[x.uuid] = {
                    selected: this.selected?.uuid == x.uuid,
                    value: x,
                    draggable:
                        !['evolved', 'hybrid'].includes(x.system.beastformType) && maximumDragTier
                            ? x.system.tier <= maximumDragTier
                            : false
                };

                return acc;
            },
            {}
        );

        context.tier = beastformTiers[this.tabGroups.primary];
        context.tierKey = this.tabGroups.primary;

        context.canSubmit = this.canSubmit();

        return context;
    }

    canSubmit() {
        if (this.selected) {
            switch (this.selected.system.beastformType) {
                case 'normal':
                    return true;
                case 'evolved':
                    return this.evolved.form;
                case 'hybrid':
                    const selectedAdvantages = Object.values(this.hybrid.advantages).reduce(
                        (acc, form) => acc + Object.values(form).length,
                        0
                    );
                    const selectedFeatures = Object.values(this.hybrid.features).reduce(
                        (acc, form) => acc + Object.values(form).length,
                        0
                    );

                    const advantagesSelected = selectedAdvantages === this.selected.system.hybrid.advantages;
                    const featuresSelected = selectedFeatures === this.selected.system.hybrid.features;
                    return advantagesSelected && featuresSelected;
            }
        }

        return false;
    }

    static updateBeastform(event, _, formData) {
        this.selected = foundry.utils.mergeObject(this.selected, formData.object);

        this.render();
    }

    static async selectBeastform(_, target) {
        this.element.querySelectorAll('.beastform-container ').forEach(element => {
            if (element.dataset.uuid === target.dataset.uuid && this.selected?.uuid !== target.dataset.uuid) {
                element.classList.remove('inactive');
            } else {
                element.classList.add('inactive');
            }
        });

        const uuid = this.selected?.uuid === target.dataset.uuid ? null : target.dataset.uuid;
        this.selected = uuid ? await foundry.utils.fromUuid(uuid) : null;

        if (this.selected) {
            if (this.selected.system.beastformType !== 'evolved') this.evolved.form = null;
            if (this.selected.system.beastformType !== 'hybrid') {
                this.hybrid.forms = {};
                this.hybrid.advantages = {};
                this.hybrid.features = {};
            } else {
                this.hybrid.forms = [...Array(this.selected.system.hybrid.beastformOptions).keys()].reduce((acc, _) => {
                    acc[foundry.utils.randomID()] = null;
                    return acc;
                }, {});
            }
        }

        this.render();
    }

    static toggleHybridFeature(_, button) {
        const current = this.hybrid.features[button.dataset.form];
        if (!current) this.hybrid.features[button.dataset.form] = {};

        if (this.hybrid.features[button.dataset.form][button.id])
            delete this.hybrid.features[button.dataset.form][button.id];
        else {
            const currentFeatures = Object.values(this.hybrid.features).reduce(
                (acc, form) => acc + Object.values(form).length,
                0
            );
            if (currentFeatures === this.selected.system.hybrid.features) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.beastformToManyFeatures'));
                return;
            }

            const feature = this.hybrid.forms[button.dataset.form].system.features.find(x => x.uuid === button.id);
            this.hybrid.features[button.dataset.form][button.id] = feature;
        }

        this.render();
    }

    static toggleHybridAdvantage(_, button) {
        const current = this.hybrid.advantages[button.dataset.form];
        if (!current) this.hybrid.advantages[button.dataset.form] = {};

        if (this.hybrid.advantages[button.dataset.form][button.id])
            delete this.hybrid.advantages[button.dataset.form][button.id];
        else {
            const currentAdvantages = Object.values(this.hybrid.advantages).reduce(
                (acc, form) => acc + Object.values(form).length,
                0
            );
            if (currentAdvantages === this.selected.system.hybrid.advantages) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.beastformToManyAdvantages'));
                return;
            }

            const advantage = this.hybrid.forms[button.dataset.form].system.advantageOn[button.id];
            this.hybrid.advantages[button.dataset.form][button.id] = advantage;
        }

        this.render();
    }

    static async submitBeastform() {
        await this.close({ submitted: true });
    }

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.selected = null;
    }

    static async configure(configData, item) {
        return new Promise(resolve => {
            const app = new this(configData, item);
            const featureItem = item;
            app.addEventListener(
                'close',
                () => resolve({ selected: app.selected, evolved: app.evolved, hybrid: app.hybrid, item: featureItem }),
                { once: true }
            );
            app.render({ force: true });
        });
    }

    async _onDragStart(event) {
        const target = event.currentTarget;
        const abort = () => event.preventDefault();
        if (!this.selected) abort();

        const draggedForm = await foundry.utils.fromUuid(target.dataset.uuid);
        if (['evolved', 'hybrid'].includes(draggedForm.system.beastformType)) abort();

        if (this.selected.system.beastformType === 'evolved') {
            if (draggedForm.system.tier > this.selected.system.evolved.maximumTier) abort();
        }
        if (this.selected.system.beastformType === 'hybrid') {
            if (draggedForm.system.tier > this.selected.system.hybrid.maximumTier) abort();
        }

        event.dataTransfer.setData('text/plain', JSON.stringify(target.dataset));
        event.dataTransfer.setDragImage(target, 60, 0);
    }

    async _onDrop(event) {
        event.stopPropagation();
        const data = foundry.applications.ux.TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (!item) return;

        if (event.target.closest('.advanced-form-container.evolved')) {
            this.evolved.form = item;
        } else {
            const hybridContainer = event.target.closest('.advanced-form-container.hybridized');
            if (hybridContainer) {
                const existingId = Object.keys(this.hybrid.forms).find(
                    key => this.hybrid.forms[key]?.uuid === item.uuid
                );
                if (existingId) this.hybrid.forms[existingId] = null;

                this.hybrid.forms[hybridContainer.id] = item;
            }
        }

        this.render();
    }
}
