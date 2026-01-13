import { RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

export default class DhSceneConfigSettings extends foundry.applications.sheets.SceneConfig {
    constructor(options) {
        super(options);

        Hooks.on(socketEvent.Refresh, ({ refreshType }) => {
            if (refreshType === RefreshType.Scene) this.render();
        });
    }

    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            removeSceneEnvironment: DhSceneConfigSettings.#removeSceneEnvironment
        }
    };

    static buildParts() {
        const { footer, tabs, ...parts } = super.PARTS;
        const tmpParts = {
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

    async _preRender(context, options) {
        await super._preFirstRender(context, options);

        if (!options.internalRefresh)
            this.daggerheartFlag = new game.system.api.data.scenes.DHScene(this.document.flags.daggerheart);
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        switch (partId) {
            case 'dh':
                htmlElement.querySelector('#rangeMeasurementSetting')?.addEventListener('change', async event => {
                    this.daggerheartFlag.updateSource({ rangeMeasurement: { setting: event.target.value } });
                    this.render({ internalRefresh: true });
                });

                const dragArea = htmlElement.querySelector('.scene-environments');
                if (dragArea) dragArea.ondrop = this._onDrop.bind(this);

                break;
        }
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const item = await foundry.utils.fromUuid(data.uuid);
        if (item instanceof game.system.api.documents.DhpActor && item.type === 'environment') {
            await this.daggerheartFlag.updateSource({
                sceneEnvironments: [...this.daggerheartFlag.sceneEnvironments, data.uuid]
            });
            this.render({ internalRefresh: true });
        }
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'dh':
                context.data = this.daggerheartFlag;
                context.variantRules = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules);
                break;
        }

        return context;
    }

    static async #removeSceneEnvironment(_event, button) {
        await this.daggerheartFlag.updateSource({
            sceneEnvironments: this.daggerheartFlag.sceneEnvironments.filter(
                (_, index) => index !== Number.parseInt(button.dataset.index)
            )
        });
        this.render({ internalRefresh: true });
    }

    /** @override */
    async _processSubmitData(event, form, submitData, options) {
        submitData.flags.daggerheart = this.daggerheartFlag.toObject();
        for (const key of Object.keys(this.document._source.flags.daggerheart?.sceneEnvironments ?? {})) {
            if (!submitData.flags.daggerheart.sceneEnvironments[key]) {
                submitData.flags.daggerheart.sceneEnvironments[`-=${key}`] = null;
            }
        }

        super._processSubmitData(event, form, submitData, options);
    }
}
