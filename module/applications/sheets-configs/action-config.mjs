import DHActionBaseConfig from './action-base-config.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

/** Config class to edit item actions */
export default class DHActionConfig extends DHActionBaseConfig {
    static DEFAULT_OPTIONS = {
        ...DHActionBaseConfig.DEFAULT_OPTIONS,
        actions: {
            ...DHActionBaseConfig.DEFAULT_OPTIONS.actions,
            addEffect: this.#onAddEffect,
            removeEffect: this.#onRemoveEffect,
            editEffect: this.#onEditEffect
        },
        dragDrop: [{ dropSelector: 'fieldset[data-key=effects]'}]
    };

    /** @inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (this.action.effects) context.effects = this.action.effects.map(e => this.action.item.effects.get(e._id));
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    /**
     * Adds an effect to this action
     * @this DHActionConfig
     * @type {ApplicationClickAction}
     */
    static async #onAddEffect(event) {
        const { areaIndex } = event.target.dataset;
        if (!this.action.effects) return;
        const data = this.action.toObject();

        const created = await this.action.item.createEmbeddedDocuments('ActiveEffect', [
            game.system.api.data.activeEffects.BaseEffect.getDefaultObject({ transfer: false })
        ]);

        if (areaIndex !== undefined) data.areas[areaIndex].effects.push(created[0]._id);
        else data.effects.push({ _id: created[0]._id });
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
        this.action.item.effects.get(created[0]._id).sheet.render(true);
    }

    getEffectDetails(id) {
        return this.action.item.effects.get(id);
    }

    static #onRemoveEffect(event, button) {
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

        this.action.item.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
    }

    static #onEditEffect(event) {
        const id = event.target.closest('[data-effect-id]')?.dataset?.effectId;
        this.action.item.effects.get(id).sheet.render(true);
    }

    /** 
     * @param {DragEvent} _event
     * @param {DhActiveEffect} effect
     */
    async _onDropActiveEffect(_event, effect) {
        const data = this.action.toObject();
        const source = effect.toObject(true);
        const created = await this.action.item.createEmbeddedDocuments('ActiveEffect', [source]);
        data.effects.push({ _id: created[0]._id });
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }
}
