
export default class DhSceneConfig extends foundry.applications.sheets.SceneConfig {

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    console.log("_preparePartContext", partId, context, options);
    context = await super._preparePartContext(partId, context, options);
    switch ( partId ) {
      case "dh":
        context.fields.rangeMeasurementSettingsOverride = "Override Global Range Measurement Settings";
        break;
      default:
        context = await super._preparePartContext(partId, context, options);
    }
    if ( partId in context.tabs ) context.tab = context.tabs[partId];
    return context;
  }

}