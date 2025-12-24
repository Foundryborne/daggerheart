export default class DhPrototypeTokenConfig extends foundry.applications.sheets.PrototypeTokenConfig {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        form: { handler: DhPrototypeTokenConfig.#onSubmit }
    };

    /** @override */
    static PARTS = {
        tabs: super.PARTS.tabs,
        identity: super.PARTS.identity,
        appearance: {
            template: 'systems/daggerheart/templates/sheets-settings/token-config/appearance.hbs',
            scrollable: ['']
        },
        vision: super.PARTS.vision,
        light: super.PARTS.light,
        resources: super.PARTS.resources,
        footer: super.PARTS.footer
    };

    /** @inheritDoc */
    async _prepareResourcesTab() {
        const token = this.token;
        const usesTrackableAttributes = !foundry.utils.isEmpty(CONFIG.Actor.trackableAttributes);
        const attributeSource =
            this.actor?.system instanceof foundry.abstract.DataModel && usesTrackableAttributes
                ? this.actor?.type
                : this.actor?.system;
        const TokenDocument = foundry.utils.getDocumentClass('Token');
        const attributes = TokenDocument.getTrackedAttributes(attributeSource);
        return {
            barAttributes: TokenDocument.getTrackedAttributeChoices(attributes, attributeSource),
            bar1: token.getBarAttribute?.('bar1'),
            bar2: token.getBarAttribute?.('bar2'),
            turnMarkerModes: DhPrototypeTokenConfig.TURN_MARKER_MODES,
            turnMarkerAnimations: CONFIG.Combat.settings.turnMarkerAnimations
        };
    }

    async _prepareAppearanceTab() {
        const context = await super._prepareAppearanceTab();
        context.tokenSizes = CONFIG.DH.ACTOR.tokenSize;
        context.tokenSize = this.token.actor?.system?.size;
        context.usesActorSize = this.token.actor?.system?.metadata?.usesSize;
        context.actorSizeDisable = context.usesActorSize && this.token.actor.system.size !== 'custom';

        return context;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        switch (partId) {
            case 'appearance':
                htmlElement
                    .querySelector('#dhTokenSize')
                    ?.addEventListener('change', this.onTokenSizeChange.bind(this));
                break;
        }
    }

    /** @inheritDoc */
    _previewChanges(changes) {
        if (!changes || !this._preview) return;

        const tokenSizeSelect = this.element?.querySelector('#dhTokenSize');
        if (this.token.actor && tokenSizeSelect && tokenSizeSelect.value !== 'custom') {
            const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
            const tokenSize = tokenSizes[tokenSizeSelect.value];
            changes.width = tokenSize;
            changes.height = tokenSize;
        }

        const deletions = { '-=actorId': null, '-=actorLink': null };
        const mergeOptions = { inplace: false, performDeletions: true };
        this._preview.updateSource(mergeObject(changes, deletions, mergeOptions));

        if (this._preview?.object?.destroyed === false) {
            this._preview.object.initializeSources();
            this._preview.object.renderFlags.set({ refresh: true });
        }
    }

    async onTokenSizeChange(event) {
        const value = event.target.value;
        const tokenSizeDimensions = this.element.querySelector('#tokenSizeDimensions');
        if (tokenSizeDimensions) {
            const disabled = value !== 'custom';

            tokenSizeDimensions.dataset.tooltip = disabled
                ? game.i18n.localize('DAGGERHEART.APPLICATIONS.TokenConfig.actorSizeUsed')
                : '';

            const disabledIcon = tokenSizeDimensions.querySelector('i');
            if (disabledIcon) {
                disabledIcon.style.opacity = disabled ? '' : '0';
            }

            const dimensionsInputs = tokenSizeDimensions.querySelectorAll('.form-fields input');
            for (const input of dimensionsInputs) {
                input.disabled = disabled;
            }
        }
    }

    /**
     * Process form submission for the sheet
     * @this {PrototypeTokenConfig}
     * @type {ApplicationFormSubmission}
     */
    static async #onSubmit(event, form, formData) {
        const submitData = this._processFormData(event, form, formData);
        submitData.detectionModes ??= []; // Clear detection modes array
        this._processChanges(submitData);
        const changes = { prototypeToken: submitData };

        const tokenSizeSelect = this.element.querySelector('#dhTokenSize');
        if (tokenSizeSelect && this.actor) {
            if (tokenSizeSelect.value !== this.actor.system.size) {
                changes.system = { size: tokenSizeSelect.value };
            }
        }

        this.actor.validate({ changes, clean: true, fallback: false });
        await this.actor.update(changes);
    }
}
