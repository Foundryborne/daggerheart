import DHTokenConfigMixin from './token-config-mixin.mjs';
import { getActorSizeFromForm } from './token-config-mixin.mjs';

export default class DhPrototypeTokenConfig extends DHTokenConfigMixin(
    foundry.applications.sheets.PrototypeTokenConfig
) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        form: { handler: DhPrototypeTokenConfig.#onSubmit }
    };

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

        const changedTokenSizeValue = getActorSizeFromForm(this.element, this.actor);
        if (changedTokenSizeValue) changes.system = { size: changedTokenSizeValue };

        this.actor.validate({ changes, clean: true, fallback: false });
        await this.actor.update(changes);
    }
}
