import DaggerheartSheet from '../sheets/daggerheart-sheet.mjs';

const { ApplicationV2 } = foundry.applications.api;
export default class DHActionConfig extends DaggerheartSheet(ApplicationV2) {
    constructor(action) {
        super({});

        this.action = action;
        this.openSection = null;
    }

    get title() {
        return `${game.i18n.localize('DAGGERHEART.GENERAL.Tabs.settings')}: ${this.action.name}`;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog'],
        window: {
            icon: 'fa-solid fa-wrench',
            resizable: false
        },
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
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/action-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        base: {
            id: 'base',
            template: 'systems/daggerheart/templates/sheets-settings/action-settings/base.hbs'
        },
        configuration: {
            id: 'configuration',
            template: 'systems/daggerheart/templates/sheets-settings/action-settings/configuration.hbs'
        },
        effect: {
            id: 'effect',
            template: 'systems/daggerheart/templates/sheets-settings/action-settings/effect.hbs'
        }
    };

    static TABS = {
        base: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'base',
            icon: null,
            label: 'Base'
        },
        config: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'config',
            icon: null,
            label: 'Configuration'
        },
        effect: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'effect',
            icon: null,
            label: 'Effect'
        }
    };

    static CLEAN_ARRAYS = ['damage.parts', 'cost', 'effects'];

    _getTabs(tabs) {
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
        context.tabs = this._getTabs(this.constructor.TABS);
        context.config = CONFIG.DH;
        if (!!this.action.effects) context.effects = this.action.effects.map(e => this.action.item.effects.get(e._id));
        if (this.action.damage?.hasOwnProperty('includeBase') && this.action.type === 'attack')
            context.hasBaseDamage = !!this.action.parent.attack;
        context.getRealIndex = this.getRealIndex.bind(this);
        context.getEffectDetails = this.getEffectDetails.bind(this);
        context.costOptions = this.getCostOptions();
        context.disableOption = this.disableOption.bind(this);
        context.isNPC = this.action.actor && this.action.actor.type !== 'character';
        context.hasRoll = this.action.hasRoll;

        const settingsTiers = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers;
        context.tierOptions = [
            { key: 1, label: game.i18n.localize('DAGGERHEART.GENERAL.Tiers.tier1') },
            ...Object.values(settingsTiers).map(x => ({ key: x.tier, label: x.name }))
        ];

        return context;
    }

    static toggleSection(_, button) {
        this.openSection = button.dataset.section === this.openSection ? null : button.dataset.section;
        this.render(true);
    }

    getCostOptions() {
        const options = foundry.utils.deepClone(CONFIG.DH.GENERAL.abilityCosts);
        const resource = this.action.parent.resource;
        if (resource) {
            options[this.action.parent.parent.id] = {
                label: this.action.parent.parent.name,
                group: 'TYPES.Actor.character'
            };
        }

        return options;
    }

    disableOption(index, costOptions, choices) {
        const filtered = foundry.utils.deepClone(costOptions);
        Object.keys(filtered).forEach(o => {
            if (choices.find((c, idx) => c.type === o && index !== idx)) filtered[o].disabled = true;
        });
        return filtered;
    }

    getRealIndex(index) {
        const data = this.action.toObject(false);
        return data.damage.parts.find(d => d.base) ? index - 1 : index;
    }

    getEffectDetails(id) {
        return this.action.item.effects.get(id);
    }

    _prepareSubmitData(_event, formData) {
        const submitData = foundry.utils.expandObject(formData.object);
        for (const keyPath of this.constructor.CLEAN_ARRAYS) {
            const data = foundry.utils.getProperty(submitData, keyPath);
            const dataValues = data ? Object.values(data) : [];
            if (keyPath === 'cost') {
                for (var value of dataValues) {
                    const item = this.action.parent.parent.id === value.key;
                    value.keyIsID = Boolean(item);
                }
            }

            if (data) foundry.utils.setProperty(submitData, keyPath, dataValues);
        }
        return submitData;
    }

    static async updateForm(event, _, formData) {
        const submitData = this._prepareSubmitData(event, formData),
            data = foundry.utils.mergeObject(this.action.toObject(), submitData),
            container = foundry.utils.getProperty(this.action.parent, this.action.systemPath);
        let newActions;
        if (Array.isArray(container)) {
            newActions = foundry.utils.getProperty(this.action.parent, this.action.systemPath).map(x => x.toObject());
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
            key = event.target.closest('[data-key]').dataset.key;
        if (!this.action[key]) return;
        data[key].push({});
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeElement(event, button) {
        event.stopPropagation();
        const data = this.action.toObject(),
            key = event.target.closest('[data-key]').dataset.key,
            index = button.dataset.index;
        data[key].splice(index, 1);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static addDamage(event) {
        if (!this.action.damage.parts) return;
        const data = this.action.toObject();
        data.damage.parts.push({});
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeDamage(event, button) {
        if (!this.action.damage.parts) return;
        const data = this.action.toObject(),
            index = button.dataset.index;
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

    static removeEffect(event, button) {
        if (!this.action.effects) return;
        const index = button.dataset.index,
            effectId = this.action.effects[index]._id;
        this.constructor.removeElement.bind(this)(event);
        this.action.item.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
    }

    static editEffect(event) {
        const id = event.target.closest('[data-effect-id]')?.dataset?.effectId;
        this.action.item.effects.get(id).sheet.render(true);
    }
}
