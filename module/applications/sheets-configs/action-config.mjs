import DHActionBaseConfig from './action-base-config.mjs';

export default class DHActionConfig extends DHActionBaseConfig {
    static DEFAULT_OPTIONS = {
        ...DHActionBaseConfig.DEFAULT_OPTIONS,
        actions: {
            ...DHActionBaseConfig.DEFAULT_OPTIONS.actions,
            addEffect: this.addEffect,
            removeEffect: this.removeEffect,
            editEffect: this.editEffect
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (!!this.action.effects) context.effects = this.action.effects.map(e => this.action.item.effects.get(e._id));
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    static async addEffect(_event) {
        if (!this.action.effects) return;
        const effectData = this._addEffectData.bind(this)();
        const data = this.action.toObject();

        const created = await game.system.api.documents.DhActiveEffect.createDialog(effectData, {
            parent: this.action.item,
            render: false
        });
        if (!created) return;

        data.effects.push({ _id: created._id });
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
        this.action.item.effects.get(created._id).sheet.render(true);
    }

    /**
     * The data for a newly created applied effect.
     * @returns {object}
     * @protected
     */
    _addEffectData() {
        return {
            name: this.action.item.name,
            img: this.action.item.img,
            origin: this.action.item.uuid,
            transfer: false
        };
    }

    getEffectDetails(id) {
        return this.action.item.effects.get(id);
    }

    static removeEffect(event, button) {
        if (!this.action.effects) return;
        const index = button.dataset.index,
            effectId = this.action.effects[index]._id;
        this.constructor.removeElement.bind(this)(event, button);
        this.action.item.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
    }

    static editEffect(event) {
        const id = event.target.closest('[data-effect-id]')?.dataset?.effectId;
        this.action.item.effects.get(id).sheet.render(true);
    }
}
