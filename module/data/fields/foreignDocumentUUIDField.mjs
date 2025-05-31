/**
 * A class extending DocumentUUIDField to allow selecting a foreign document reference
 * that resolves to either the document, the index(for items in compenidums) or the UUID string.
 */
export default class ForeignDocumentUUIDField extends foundry.data.fields.DocumentUUIDField {
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      nullable: true,
      readonly: false,
      idOnly: false,
    });
  }

  initialize(value, _model, _options = {}) {
    if (this.idOnly) return value;
    return () => {
      try {
        const doc = fromUuidSync(value);
        return doc;
      } catch (error) {
        console.error(error);
        return value ?? null;
      }
    };
  }

  toObject(value) {
    return value?.uuid ?? value;
  }
}
