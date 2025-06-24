import DaggerheartSheet from '../sheets/daggerheart-sheet.mjs';

const { ApplicationV2 } = foundry.applications.api;
export default class DHActionConfig extends DaggerheartSheet(ApplicationV2) {
    constructor(action) {
        super({});

        this.action = action;
        this.openSection = null;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-action',
        classes: ['daggerheart', 'views', 'action'],
        position: { width: 600, height: 'auto' },
        actions: {
            toggleSection: this.toggleSection,
            addEffect: this.addEffect,
            removeEffect: this.removeEffect,
            addElement: this.addElement,
            removeElement: this.removeElement,
            editEffect: this.editEffect,
            addDamage: this.addDamage,
            removeDamage: this.removeDamage
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        form: {
            id: 'action',
            template: 'systems/daggerheart/templates/views/action.hbs'
        }
    };

    _getTabs() {
        const tabs = {
            base: { active: true, cssClass: '', group: 'primary', id: 'base', icon: null, label: 'Base' },
            config: { active: false, cssClass: '', group: 'primary', id: 'config', icon: null, label: 'Configuration' },
            effect: { active: false, cssClass: '', group: 'primary', id: 'effect', icon: null, label: 'Effect' }
        };

        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options, 'action');
        context.source = this.action.toObject(false);
        context.openSection = this.openSection;
        context.tabs = this._getTabs();
        context.config = SYSTEM;
        if (!!this.action.effects) context.effects = this.action.effects.map(e => this.action.item.effects.get(e._id));
        if (this.action.damage?.hasOwnProperty('includeBase') && this.action.type === 'attack')
            context.hasBaseDamage = !!this.action.parent.damage;
        context.getRealIndex = this.getRealIndex.bind(this);
        context.disableOption = this.disableOption.bind(this);
        context.isNPC = this.action.actor.type !== 'character';

        return context;
    }

    static toggleSection(_, button) {
        this.openSection = button.dataset.section === this.openSection ? null : button.dataset.section;
        this.render(true);
    }

    disableOption(index, options, choices) {
        const filtered = foundry.utils.deepClone(options);
        Object.keys(filtered).forEach(o => {
            if (choices.find((c, idx) => c.type === o && index !== idx)) delete filtered[o];
        });
        return filtered;
    }

    getRealIndex(index) {
        const data = this.action.toObject(false);
        return data.damage.parts.find(d => d.base) ? index - 1 : index;
    }

    _prepareSubmitData(event, formData) {
        const submitData = foundry.utils.expandObject(formData.object);
        // this.element.querySelectorAll("fieldset[disabled] :is(input, select)").forEach(input => {
        //     foundry.utils.setProperty(submitData, input.name, input.value);
        // });
        return submitData;
    }

    static async updateForm(event, _, formData) {
        const submitData = this._prepareSubmitData(event, formData),
            data = foundry.utils.expandObject(foundry.utils.mergeObject(this.action.toObject(), submitData)),
            container = foundry.utils.getProperty(this.action.parent, this.action.systemPath);
        let newActions;
        if (Array.isArray(container)) {
            newActions = foundry.utils.getProperty(this.action.parent, this.action.systemPath).map(x => x.toObject()); // Find better way
            if (!newActions.findSplice(x => x._id === data._id, data)) newActions.push(data);
        } else newActions = data;

        const updates = await this.action.parent.parent.update({ [`system.${this.action.systemPath}`]: newActions });
        if (!updates) return;
        this.action = Array.isArray(container)
            ? foundry.utils.getProperty(updates.system, this.action.systemPath)[this.action.index]
            : foundry.utils.getProperty(updates.system, this.action.systemPath);
        this.render();
    }

    static addElement(event) {
        const data = this.action.toObject(),
            key = event.target.closest('.action-category-data').dataset.key;
        if (!this.action[key]) return;
        data[key].push({});
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeElement(event) {
        const data = this.action.toObject(),
            key = event.target.closest('.action-category-data').dataset.key,
            index = event.target.dataset.index;
        data[key].splice(index, 1);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static addDamage(event) {
        if (!this.action.damage.parts) return;
        const data = this.action.toObject();
        data.damage.parts.push({});
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeDamage(event) {
        if (!this.action.damage.parts) return;
        const data = this.action.toObject(),
            index = event.target.dataset.index;
        data.damage.parts.splice(index, 1);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static async addEffect(event) {
        if (!this.action.effects) return;
        const effectData = this._addEffectData.bind(this)(),
            [created] = await this.action.item.createEmbeddedDocuments('ActiveEffect', [effectData], { render: false }),
            data = this.action.toObject();
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

    static removeEffect(event) {
        if (!this.action.effects) return;
        const index = event.target.dataset.index,
            effectId = this.action.effects[index]._id;
        this.constructor.removeElement.bind(this)(event);
        this.action.item.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
    }

    static editEffect(event) {}
}
