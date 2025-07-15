export default class DhTokenConfig extends foundry.applications.sheets.TokenConfig {
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
            turnMarkerModes: DhTokenConfig.TURN_MARKER_MODES,
            turnMarkerAnimations: CONFIG.Combat.settings.turnMarkerAnimations
        };
    }
}
