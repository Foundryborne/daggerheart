export default class DhSceneConfigSettings extends foundry.applications.sheets.SceneConfig {
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            addSceneEnvironment: DhSceneConfigSettings.#addSceneEnvironment,
            removeSceneEnvironment: DhSceneConfigSettings.#removeSceneEnvironment
        }
    };

    static buildParts() {
        const { footer, tabs, ...parts } = super.PARTS;
        const tmpParts = {
            // tabs,
            tabs: { template: 'systems/daggerheart/templates/scene/tabs.hbs' },
            ...parts,
            dh: { template: 'systems/daggerheart/templates/scene/dh-config.hbs' },
            footer
        };
        return tmpParts;
    }

    static PARTS = DhSceneConfigSettings.buildParts();

    static buildTabs() {
        super.TABS.sheet.tabs.push({ id: 'dh', src: 'systems/daggerheart/assets/logos/FoundryBorneLogoWhite.svg' });
        return super.TABS;
    }

    static TABS = DhSceneConfigSettings.buildTabs();

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        switch (partId) {
            case 'dh':
                htmlElement.querySelector('#rangeMeasurementSetting')?.addEventListener('change', async event => {
                    const flagData = foundry.utils.mergeObject(this.document.flags.daggerheart, {
                        rangeMeasurement: { setting: event.target.value }
                    });
                    this.document.flags.daggerheart = flagData;
                    this.render();
                });

                htmlElement.querySelectorAll('.scene-environment').forEach(element => {
                    element.querySelector('select')?.addEventListener('change', async event => {
                        const id = event.target.dataset.key;
                        const flagData = foundry.utils.mergeObject(this.document.flags.daggerheart, {
                            sceneEnvironments: { [id]: { icon: event.target.value } }
                        });
                        this.document.flags.daggerheart = flagData;
                        this.render();
                    });

                    element.ondrop = this._onDrop.bind(this);
                });

                break;
        }
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const item = await foundry.utils.fromUuid(data.uuid);
        if (item instanceof game.system.api.documents.DhpActor && item.type === 'environment') {
            const element = event.target.closest('.scene-environment');
            const flagData = foundry.utils.mergeObject(this.document.flags.daggerheart, {
                sceneEnvironments: { [element.dataset.key]: { environment: data.uuid } }
            });
            this.document.flags.daggerheart = flagData;
            this.render();
        }
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'dh':
                context.data = new game.system.api.data.scenes.DHScene(canvas.scene.flags.daggerheart);
                context.variantRules = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules);
                context.environmentIcons = CONFIG.DH.GENERAL.environmentIcons;
                break;
        }

        return context;
    }

    static async #addSceneEnvironment() {
        const flagData = foundry.utils.mergeObject(this.document.flags.daggerheart, {
            sceneEnvironments: { [foundry.utils.randomID()]: { icon: CONFIG.DH.GENERAL.environmentIcons.tree.icon } }
        });
        this.document.flags.daggerheart = flagData;

        this.render();
    }

    static async #removeSceneEnvironment(_event, button) {
        this.document.flags.daggerheart.sceneEnvironments = Object.keys(
            this.document.flags.daggerheart.sceneEnvironments
        ).reduce((acc, key) => {
            if (key !== button.dataset.key) acc[key] = this.document.flags.daggerheart.sceneEnvironments[key];
            return acc;
        }, {});
        this.render();
    }

    /** @override */
    async _processSubmitData(event, form, submitData, options) {
        submitData.flags.daggerheart.sceneEnvironments = this.document.flags.daggerheart.sceneEnvironments;
        for (const key of Object.keys(this.document._source.flags.daggerheart.sceneEnvironments)) {
            if (!submitData.flags.daggerheart.sceneEnvironments[key]) {
                submitData.flags.daggerheart.sceneEnvironments[`-=${key}`] = null;
            }
        }

        super._processSubmitData(event, form, submitData, options);
    }
}
