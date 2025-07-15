export default class DhPrototypeTokenConfig extends foundry.applications.sheets.PrototypeTokenConfig {
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
}
