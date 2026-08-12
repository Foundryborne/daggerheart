import DHActionBaseConfig from './action-base-config.mjs';

export default class DHActionConfig extends DHActionBaseConfig {
    static DEFAULT_OPTIONS = {
        ...DHActionBaseConfig.DEFAULT_OPTIONS,
        actions: {
            ...DHActionBaseConfig.DEFAULT_OPTIONS.actions,
            addEffect: this.addEffect,
            removeEffect: this.removeEffect,
            editEffect: this.editEffect,
            toggleEvolutionTokenData: this.#onToggleEvolutionTokenData
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (this.action.effects) context.effects = this.action.effects.map(e => this.item.effects.get(e._id));
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    static async addEffect(event) {
        const { areaIndex } = event.target.dataset;
        if (!this.action.effects) return;
        const data = this.action.toObject();
        const effectData = game.system.api.data.activeEffects.BaseEffect.getDefaultObject(
            {
                transfer: false,
                origin: this.item.uuid
            }
        );

        const [created] = await this.item.createEmbeddedDocuments('ActiveEffect', [effectData]);

        if (areaIndex !== undefined) data.areas[areaIndex].effects.push(created._id);
        else data.effects.push({ _id: created._id });
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
        this.item.effects.get(created._id).sheet.render(true);
    }

    getEffectDetails(id) {
        return this.item.effects.get(id);
    }

    static removeEffect(event, button) {
        if (!this.action.effects) return;

        const { areaIndex, index } = button.dataset;
        let effectId;
        if (areaIndex !== undefined) {
            effectId = this.action.areas[areaIndex].effects[index];
            const data = this.action.toObject();
            data.areas[areaIndex].effects.splice(index, 1);
            this.constructor.updateForm.call(this, null, null, { object: foundry.utils.flattenObject(data) });
        } else {
            effectId = this.action.effects[index]._id;
            this.constructor.removeElement.call(this, event, button);
        }

        this.item.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
    }

    static editEffect(event) {
        const id = event.target.closest('[data-effect-id]')?.dataset?.effectId;
        this.item.effects.get(id).sheet.render(true);
    }

    static #onToggleEvolutionTokenData(_event, target) {
        const data = this.action.toObject();
        if (target.checked) {
            data.evolution.tokenOverride = {};
        } else {
            data.evolution.tokenOverride = null;
        }

        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }
}
