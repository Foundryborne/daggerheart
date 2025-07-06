import DHApplicationMixin from './application-mixin.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * A base actor sheet extending {@link ActorSheetV2} via {@link DHApplicationMixin}
 * @extends ActorSheetV2
 * @mixes DHSheetV2
 */
export default class DHBaseActorSheet extends DHApplicationMixin(ActorSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['actor'],
    position: {
      width: 480,
    },
    form: {
      submitOnChange: true
    },
    actions: {},
    dragDrop: []
  };

  async _prepareContext(_options) {
    const context = await super._prepareContext(_options);
    context.isNPC = this.document.isNPC;

    return context;
  }
}