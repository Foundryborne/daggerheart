import DHTokenConfigMixin from './token-config-mixin.mjs';
import { getActorSizeFromForm } from './token-config-mixin.mjs';

export default class DhTokenConfig extends DHTokenConfigMixin(foundry.applications.sheets.TokenConfig) {
    async _processSubmitData(event, form, submitData, options) {
        const changedTokenSizeValue = getActorSizeFromForm(this.element, this.actor);
        if (changedTokenSizeValue) this.token.actor.update({ 'system.size': changedTokenSizeValue });

        super._processSubmitData(event, form, submitData, options);
    }
}
