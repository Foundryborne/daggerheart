import DHActionBaseConfig from './action-base-config.mjs';

export default class DHActionSettingsConfig extends DHActionBaseConfig {
    constructor(action, effects, sheetUpdate) {
        super(action);

        this.effects = effects;
        this.sheetUpdate = sheetUpdate;

        this._dragDrop = this._createDragDropHandlers();
    }

    static DEFAULT_OPTIONS = {
        ...DHActionBaseConfig.DEFAULT_OPTIONS,
        dragDrop: [{ dragSelector: null, dropSelector: '.summon-actor-drop' }],
        actions: {
            ...DHActionBaseConfig.DEFAULT_OPTIONS.actions,
            addEffect: this.addEffect,
            removeEffect: this.removeEffect,
            editEffect: this.editEffect
        }
    };

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const summonData = this.action.summon || [];
        context.summonActors = await Promise.all(summonData.map(async (entry) => {
            if (!entry.actorUUID) return null;
            const actor = await fromUuid(entry.actorUUID);
            return actor ? { name: actor.name, img: actor.img } : { name: "Unknown", img: "icons/svg/mystery-man.svg" };
        }));
        context.effects = this.effects;
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    getEffectDetails(id) {
        return this.effects.find(x => x.id === id);
    }

    static async addEffect(_event) {
        if (!this.action.effects) return;
        const effectData = game.system.api.data.activeEffects.BaseEffect.getDefaultObject();
        const data = this.action.toObject();

        this.sheetUpdate(data, effectData);
        this.effects = [...this.effects, effectData];
        data.effects.push({ _id: effectData.id });
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeEffect(event, button) {
        if (!this.action.effects) return;
        const index = button.dataset.index,
            effectId = this.action.effects[index]._id;
        this.constructor.removeElement.bind(this)(event, button);
        this.sheetUpdate(
            this.action.toObject(),
            this.effects.find(x => x.id === effectId),
            true
        );
    }

    static async editEffect(event) {
        const id = event.target.closest('[data-effect-id]')?.dataset?.effectId;
        const updatedEffect = await game.system.api.applications.sheetConfigs.SettingActiveEffectConfig.configure(
            this.getEffectDetails(id)
        );
        if (!updatedEffect) return;

        this.effects = await this.sheetUpdate(this.action.toObject(), { ...updatedEffect, id });
        this.render();
    }

    //For drag drop implementation for summon actor selection
    _onRender(context, options) {
        super._onRender(context, options);
        this._dragDrop.forEach(d => d.bind(this.element));
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        console.log("Daggerheart | Summon Drop Data:", data);

        if (!data || !data.uuid) return;

        const doc = await fromUuid(data.uuid);
        if (!doc) return;


        let actorUuid = null;

        if (doc.documentName === "Actor") {
            actorUuid = doc.uuid;
        } else if (doc.documentName === "Token" && doc.actor) {
            actorUuid = doc.actor.uuid;
        } else {
            console.warn("Daggerheart | Dropped document is not an Actor:", doc);
            return;
        }

        const dropZone = event.target.closest('.summon-actor-drop');
        if (!dropZone) return;
        
        const index = Number(dropZone.dataset.index);

        const actionData = this.action.toObject();
        if (!actionData.summon) actionData.summon = [];
        
        if (actionData.summon[index]) {
            actionData.summon[index].actorUUID = actorUuid;
            
            // Trigger update
            this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(actionData) });
        }
    }
}
