import DaggerheartSheet from '../sheets/daggerheart-sheet.mjs';

const { ApplicationV2 } = foundry.applications.api;
export default class DHActionBaseConfig extends DaggerheartSheet(ApplicationV2) {
    constructor(action) {
        super({});

        this.action = action;
        this.openSection = null;
        this.openTrigger = this.action.triggers.length > 0 ? 0 : null;
    }

    get title() {
        return `${game.i18n.localize('DAGGERHEART.GENERAL.Tabs.settings')}: ${this.action.name}`;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'action-config', 'dialog', 'max-800'],
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
            removeDamage: this.removeDamage,
            editDoc: this.editDoc,
            addTrigger: this.addTrigger,
            removeTrigger: this.removeTrigger,
            expandTrigger: this.expandTrigger
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: '#summon-drop-zone', handlers: ['_onDrop'] }]
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
        },
        trigger: {
            id: 'trigger',
            template: 'systems/daggerheart/templates/sheets-settings/action-settings/trigger.hbs'
        }
    };

    static TABS = {
        base: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'base',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.base'
        },
        config: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'config',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.configuration'
        },
        effect: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'effect',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.effects'
        },
        trigger: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'trigger',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.triggers'
        }
    };

    static CLEAN_ARRAYS = ['damage.parts', 'cost', 'effects', 'summon'];

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.summon-count-wrapper input').forEach(element => {
            element.addEventListener('change', this.updateSummonCount.bind(this));
        });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options, 'action');
        context.source = this.action.toObject(true);

        context.summons = [];
        for (const summon of context.source.summon ?? []) {
            const actor = await foundry.utils.fromUuid(summon.actorUUID);
            context.summons.push({ actor, count: summon.count });
        }

        context.openSection = this.openSection;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.config = CONFIG.DH;
        if (this.action.damage?.hasOwnProperty('includeBase') && this.action.type === 'attack')
            context.hasBaseDamage = !!this.action.parent.attack;
        context.costOptions = this.getCostOptions();
        context.getRollTypeOptions = this.getRollTypeOptions();
        context.disableOption = this.disableOption.bind(this);
        context.isNPC = this.action.actor?.isNPC;
        context.baseSaveDifficulty = this.action.actor?.baseSaveDifficulty;
        context.baseAttackBonus = this.action.actor?.system.attack?.roll.bonus;
        context.hasRoll = this.action.hasRoll;
        context.triggers = context.source.triggers.map((trigger, index) => {
            const { hint, returns, usesActor } = CONFIG.DH.TRIGGER.triggers[trigger.trigger];
            return {
                ...trigger,
                hint,
                returns,
                usesActor,
                revealed: this.openTrigger === index
            };
        });

        const settingsTiers = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers;
        context.tierOptions = [
            { key: 1, label: game.i18n.localize('DAGGERHEART.GENERAL.Tiers.1') },
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
            options.resource = {
                label: 'DAGGERHEART.GENERAL.itemResource',
                group: 'Global'
            };
        }

        if (this.action.parent.metadata?.isQuantifiable) {
            options.quantity = {
                label: 'DAGGERHEART.GENERAL.itemQuantity',
                group: 'Global'
            };
        }

        return options;
    }

    getRollTypeOptions() {
        const types = foundry.utils.deepClone(CONFIG.DH.GENERAL.rollTypes);
        if (!this.action.actor) return types;
        Object.values(types).forEach(t => {
            if (this.action.actor.type !== 'character' && t.playerOnly) delete types[t.id];
        });
        return types;
    }

    disableOption(index, costOptions, choices) {
        const filtered = foundry.utils.deepClone(costOptions);
        Object.keys(filtered).forEach(o => {
            if (choices.find((c, idx) => c.type === o && index !== idx)) filtered[o].disabled = true;
        });
        return filtered;
    }

    _prepareSubmitData(_event, formData) {
        const submitData = foundry.utils.expandObject(formData.object);

        const itemAbilityCostKeys = Object.keys(CONFIG.DH.GENERAL.itemAbilityCosts);
        for (const keyPath of this.constructor.CLEAN_ARRAYS) {
            const data = foundry.utils.getProperty(submitData, keyPath);
            const dataValues = data ? Object.values(data) : [];
            if (keyPath === 'cost') {
                for (var value of dataValues) {
                    value.itemId = itemAbilityCostKeys.includes(value.key) ? this.action.parent.parent.id : null;
                }
            }

            if (data) foundry.utils.setProperty(submitData, keyPath, dataValues);
        }
        return submitData;
    }

    static async updateForm(event, _, formData) {
        const submitData = this._prepareSubmitData(event, formData);

        const data = foundry.utils.mergeObject(this.action.toObject(), submitData);
        this.action = await this.action.update(data);

        this.sheetUpdate?.(this.action);
        this.render();
    }

    static addElement(event) {
        const data = this.action.toObject(),
            key = event.target.closest('[data-key]').dataset.key;
        if (!this.action[key]) return;

        data[key].push(this.action.defaultValues[key] ?? {});
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeElement(event, button) {
        event.stopPropagation();
        const data = this.action.toObject(),
            key = event.target.closest('[data-key]').dataset.key;

        // Prefer explicit index, otherwise find by uuid
        let index = button?.dataset.index;
        if (index === undefined || index === null || index === '') {
            const uuid = button?.dataset.uuid ?? button?.dataset.itemUuid;
            index = data[key].findIndex(e => (e?.actorUUID ?? e?.uuid) === uuid);
            if (index === -1) return;
        } else index = Number(index);

        data[key].splice(index, 1);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static async editDoc(_event, target) {
        const element = target.closest('[data-item-uuid]');
        const doc = (await foundry.utils.fromUuid(element.dataset.itemUuid)) ?? null;
        if (doc) return doc.sheet.render({ force: true });
    }

    static addDamage(_event) {
        if (!this.action.damage.parts) return;
        const data = this.action.toObject(),
            part = {};
        if (this.action.actor?.isNPC) part.value = { multiplier: 'flat' };
        data.damage.parts.push(part);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static removeDamage(_event, button) {
        if (!this.action.damage.parts) return;
        const data = this.action.toObject(),
            index = button.dataset.index;
        data.damage.parts.splice(index, 1);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static addTrigger() {
        const data = this.action.toObject();
        data.triggers.push({
            trigger: CONFIG.DH.TRIGGER.triggers.dualityRoll.id,
            triggeringActor: CONFIG.DH.TRIGGER.triggerActorTargetType.any.id
        });
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static async removeTrigger(_event, button) {
        const trigger = CONFIG.DH.TRIGGER.triggers[this.action.triggers[button.dataset.index].trigger];
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize('DAGGERHEART.ACTIONS.Config.deleteTriggerTitle')
            },
            content: game.i18n.format('DAGGERHEART.ACTIONS.Config.deleteTriggerContent', {
                trigger: game.i18n.localize(trigger.label)
            })
        });

        if (!confirmed) return;

        const data = this.action.toObject();
        data.triggers = data.triggers.filter((_, index) => index !== Number.parseInt(button.dataset.index));
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static async expandTrigger(_event, button) {
        const index = Number.parseInt(button.dataset.index);
        const toggle = (element, codeMirror) => {
            codeMirror.classList.toggle('revealed');
            const button = element.querySelector('a > i');
            button.classList.toggle('fa-angle-up');
            button.classList.toggle('fa-angle-down');
        };

        const fieldset = button.closest('fieldset');
        const codeMirror = fieldset.querySelector('.code-mirror-wrapper');
        toggle(fieldset, codeMirror);

        if (this.openTrigger !== null && this.openTrigger !== index) {
            const previouslyExpanded = fieldset
                .closest(`section`)
                .querySelector(`fieldset[data-index="${this.openTrigger}"]`);
            const codeMirror = previouslyExpanded.querySelector('.code-mirror-wrapper');
            toggle(previouslyExpanded, codeMirror);
            this.openTrigger = index;
        } else if (this.openTrigger === index) {
            this.openTrigger = null;
        } else {
            this.openTrigger = index;
        }
    }

    updateSummonCount(event) {
        event.stopPropagation();
        const wrapper = event.target.closest('.summon-count-wrapper');
        const index = wrapper.dataset.index;
        const data = this.action.toObject();
        data.summon[index].count = event.target.value;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** Specific implementation in extending classes **/
    static async addEffect(_event) {}
    static removeEffect(_event, _button) {}
    static editEffect(_event) {}

    async close(options) {
        this.tabGroups.primary = 'base';
        await super.close(options);
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.getDragEventData(event);
        const item = await foundry.utils.fromUuid(data.uuid);
        if (!(item instanceof game.system.api.documents.DhpActor)) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.summon.invalidDrop'));
            return;
        }

        const actionData = this.action.toObject();
        let countvalue = 1;
        for (const entry of actionData.summon) {
            if (entry.actorUUID === data.uuid) {
                entry.count += 1;
                countvalue = entry.count;
                await this.constructor.updateForm.bind(this)(null, null, {
                    object: foundry.utils.flattenObject(actionData)
                });
                return;
            }
        }

        actionData.summon.push({ actorUUID: data.uuid, count: countvalue });
        await this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(actionData) });
    }
}
