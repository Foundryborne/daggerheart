const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class PseudoDocumentSheet extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options) {
    super(options);
    this.#pseudoDocument = options.document;
  }

  /**
  * The UUID of the associated pseudo-document
  * @type {string}
  */
  get pseudoUuid() {
    return this.pseudoDocument.uuid;
  }

  #pseudoDocument;

  /**
   * The pseudo-document instance this sheet represents
   * @type {object}
   */
  get pseudoDocument() {
    return this.#pseudoDocument;
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['daggerheart', 'sheet'],
    position: { width: 600 },
    form: {
      handler: PseudoDocumentSheet.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false
    },
    dragDrop: [{ dragSelector: null, dropSelector: null }],
  };

  static PARTS = {
    header: { template: 'systems/daggerheart/templates/sheets/pseudo-documents/header.hbs' },
  };

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const document = this.pseudoDocument;
    return Object.assign(context, {
      document,
      source: document._source,
      editable: this.isEditable,
      user: game.user,
      rootId: this.id,
    });
  }

  /**
   * Form submission handler
   * @param {SubmitEvent | Event} event - The originating form submission or input change event
   * @param {HTMLFormElement} form - The form element that was submitted
   * @param {foundry.applications.ux.FormDataExtended} formData - Processed data for the submitted form
   */
  static async #onSubmitForm(event, form, formData) {
    const submitData = foundry.utils.expandObject(formData.object);
    await this.pseudoDocument.update(submitData);
  }
}
