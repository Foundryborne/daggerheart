export default class DhPrototypeTokenConfig extends foundry.applications.sheets.PrototypeTokenConfig {
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
        context.actorSizeUsed = this.token.actor ? Boolean(this.token.actor.system.size) : false;

        return context;
    }
}
