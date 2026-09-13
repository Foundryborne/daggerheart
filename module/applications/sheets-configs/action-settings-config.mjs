import DHActionBaseConfig from './action-base-config.mjs';

export default class DHActionSettingsConfig extends DHActionBaseConfig {
    constructor(action, effects, sheetUpdate) {
        super(action);

        this.effects = effects;
        this.sheetUpdate = sheetUpdate;
    }

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
        context.effects = this.effects;
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    getEffectDetails(id) {
        return this.effects.find(x => x.id === id);
    }

    static async addEffect(_event) {
        const { areaIndex } = event.target.dataset;
        if (!this.action.effects) return;

        // const createData = game.system.api.data.activeEffects.BaseEffect.getDefaultObject({ transfer: false });
        const typeChoices = {
            BaseEffect: 'TYPES.ActiveEffect.base',
            EphemeralEffect: 'TYPES.ActiveEffect.ephemeral'
        };
        const content = new foundry.data.fields.StringField({
            label: _loc('DAGGERHEART.GENERAL.type'),
            choices: typeChoices,
            required: true
        }).toFormGroup({}, { name: 'type', localize: true }).outerHTML;

        const callback = async (_, button) => {
            const type = button.form.elements.type.value;
            if (!type) return;

            const effectData = game.system.api.data.activeEffects[type].getDefaultObject({ transfer: false });
            const data = this.action.toObject();

            this.sheetUpdate(data, effectData);
            this.effects = [...this.effects, effectData];

            if (areaIndex !== undefined) data.areas[areaIndex].effects.push(effectData.id);
            else data.effects.push({ _id: effectData.id });

            this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
        };

        await foundry.applications.api.DialogV2.prompt({
            content: content,
            rejectClose: false,
            modal: true,
            ok: { callback: callback.bind(this) },
            window: {
                title: _loc('DAGGERHEART.ACTIVEEFFECT.Config.settingsCreateTitle')
            },
            position: { width: 400 }
        });
    }

    static removeEffect(event, button) {
        if (!this.action.effects) return;
        const { areaIndex, index } = button.dataset;
        let effectId = null;
        if (areaIndex !== undefined) {
            effectId = this.action.areas[areaIndex].effects[index];
            const data = this.action.toObject();
            data.areas[areaIndex].effects.splice(index, 1);
            this.constructor.updateForm.call(this, null, null, { object: foundry.utils.flattenObject(data) });
        } else {
            effectId = this.action.effects[index]._id;
            this.constructor.removeElement.call(this, event, button);
        }

        this.sheetUpdate(
            this.action.toObject(),
            this.effects.find(x => x.id === effectId),
            true
        );
    }

    static async editEffect(event) {
        const id = event.target.closest('[data-effect-id]')?.dataset?.effectId;
        const updatedEffect = await game.system.api.applications.sheetConfigs.ActiveEffectConfig.configureSetting(
            this.getEffectDetails(id)
        );
        if (!updatedEffect) return;

        this.effects = await this.sheetUpdate(this.action.toObject(), { ...updatedEffect, id });
        this.render();
    }
}
