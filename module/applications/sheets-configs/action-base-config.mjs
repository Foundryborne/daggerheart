import { DHDamageData } from '../../data/fields/action/damageField.mjs';
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

    get item() {
        return this.action?.item;
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
            copyUuid: { handler: DHActionBaseConfig.#onCopyUuid, buttons: [0, 2] },
            toggleSection: this.toggleSection,
            addEffect: this.addEffect,
            removeEffect: this.removeEffect,
            addElement: this.addElement,
            removeElement: this.removeElement,
            removeTransformActor: this.removeTransformActor,
            editEffect: this.editEffect,
            addDamage: this.#onAddDamage,
            removeDamage: this.#onRemoveDamage,
            addDamageResource: this.#onAddDamageResource,
            removeDamageResource: this.#onRemoveDamageResource,
            editDoc: this.editDoc,
            addTrigger: this.addTrigger,
            removeTrigger: this.removeTrigger,
            expandTrigger: this.expandTrigger,
            addBeastformTraitBonus: this.addBeastformTraitBonus,
            removeBeastformTraitBonus: this.removeBeastformTraitBonus
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: '[data-is-drop-zone]', handlers: ['_onDrop'] }]
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

    static CLEAN_ARRAYS = ['cost', 'effects', 'summon'];

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.summon-count-wrapper input'))
            element.addEventListener('change', this.#onUpdateSummonCount.bind(this));

        for (const element of htmlElement.querySelectorAll('.transform-resource input'))
            element.addEventListener('change', this.#onUpdateTransformResource.bind(this));

        for (const element of htmlElement.querySelectorAll('.evolution-state-select'))
            element.addEventListener('change', this.#onUpdateEvolutionStateSelect.bind(this));

        for (const element of htmlElement.querySelectorAll('.evolution-resource input'))
            element.addEventListener('change', this.#onUpdateEvolutionResource.bind(this));
    }

    /** @inheritDoc */
    _onFirstRender(context, options) {
        super._onFirstRender(context, options);
        this.item.apps[this.id] = this;
    }

    /** @override */
    _onClose(_options) {
        delete this.item.apps[this.id];
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options, 'action');
        context.source = this.action.toObject(true);
        context.action = this.action;

        context.summons = [];
        for (const summon of context.source.summon ?? []) {
            const actor = await foundry.utils.fromUuid(summon.actorUUID);
            context.summons.push({ actor, count: summon.count });
        }

        if (context.source.transform) {
            const actor = await foundry.utils.fromUuid(context.source.transform.actorUUID);
            context.transform = {
                ...context.source.transform,
                actor:
                    actor ??
                    (context.source.transform.actorUUID && !actor
                        ? { error: game.i18n.localize('DAGGERHEART.ACTIONS.Settings.transform.actorIsMissing') }
                        : null)
            };
        }

        if (context.source.evolution) {
            const actorFeatures = (this.action.actor?.items ?? []).filter(x => x.type === 'feature' && x.id !== this.action.item?.id);
            context.evolutionFeatures = actorFeatures.map(item => ({
                id: item.id,
                name: item.name,
                state: context.source.evolution.evolutionFeatures[item.id] ?? ''
            }));
            context.evolutionStates = {
                ['']: { id: '', label: _loc('None') },
                ...CONFIG.DH.ACTIONS.evolutionStates
            };
        }

        context.openSection = this.openSection;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.config = CONFIG.DH;
        if (this.action.damage) {
            const allKeys = Object.keys(CONFIG.DH.GENERAL.healingTypes);
            context.allDamageTypesUsed = allKeys.every(k => k in this.action._source.damage.resources);
            context.hasBaseDamage = this.action.damage?.main?.hasOwnProperty('includeBase');
        }

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

    /** @inheritDoc */
    _getFrameButtons(options) {
        const buttons = super._getFrameButtons(options);
        buttons.push({
            icon: 'fa-solid fa-passport',
            label: 'APPLICATION.ACTIONS.CopyUuid',
            action: 'copyUuid'
        });
        return buttons;
    }

    static #onCopyUuid(event, button) {
        event.preventDefault();
        event.stopPropagation();
        if (event.detail > 1) return;
        const id = event.button === 2 ? this.action.id : this.action.uuid;
        const type = event.button === 2 ? 'ID' : 'UUID';
        const label = game.i18n.localize(this.action.metadata.label);
        game.clipboard.copyPlainText(id);
        ui.notifications.info(game.i18n.format('DOCUMENT.IdCopiedClipboard', { label, type, id }));
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

        if (this.action.parent.metadata?.isInventoryItem) {
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
        for (const t of Object.values(types)) {
            if (this.action.actor.type !== 'character' && t.playerOnly) delete types[t.id];
        }
        return types;
    }

    disableOption(index, costOptions, choices) {
        const filtered = foundry.utils.deepClone(costOptions);
        for (const o of Object.keys(filtered)) {
            if (choices.find((c, idx) => c.type === o && index !== idx)) filtered[o].disabled = true;
        }

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
        this.action = (await this.action.update(data)) ?? this.action;

        this.sheetUpdate?.(this.action);
        this.render();
    }

    static addElement(event) {
        const data = this.action.toObject(),
            key = event.target.closest('[data-key]').dataset.key;
        if (!this.action[key]) return;

        const value = key === 'areas' ? { name: this.action.item.name } : {};

        data[key].push(this.action.defaultValues[key] ?? value);
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

    static async removeTransformActor() {
        const data = this.action.toObject();
        data.transform.actorUUID = null;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** @this DHActionBaseConfig */
    static #onAddDamage() {
        if (!this.action.damage || this.action.damage?.main) return;

        const data = this.action.toObject();
        data.damage.main = {
            ...DHDamageData.schema.getInitialValue(),
            applyTo: 'hitPoints',
            type: 'physical'
        };
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** @this DHActionBaseConfig */
    static #onRemoveDamage() {
        if (!this.action.damage?.main) return;
        const data = this.action.toObject();
        data.damage.main = null;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** @this DHActionBaseConfig */
    static #onAddDamageResource(_event) {
        if (!this.action.damage) return;

        const allKeys = Object.keys(CONFIG.DH.GENERAL.healingTypes);
        const unused = allKeys.filter(k => !(k in this.action._source.damage.resources));
        const choices = unused.map(k => ({ value: k, label: _loc(CONFIG.DH.GENERAL.healingTypes[k].label) }));
        const content = new foundry.data.fields.StringField({
            label: _loc('DAGGERHEART.GENERAL.Resource.single'),
            choices,
            required: true
        }).toFormGroup({}, {
            name: 'type',
            localize: true,
            nameAttr: 'value',
            labelAttr: 'label'
        }).outerHTML;

        const callback = (_, button) => {
            const data = this.action.toObject();
            const type = choices[button.form.elements.type.value].value;
            data.damage.resources[type] = {
                ...this.action.schema.fields.damage.fields.resources.element.getInitialValue(),
                applyTo: type
            };
            this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
        };

        const typeDialog = new foundry.applications.api.DialogV2({
            buttons: [
                {
                    action: 'ok',
                    label: 'Confirm',
                    icon: 'fas fa-check',
                    default: true,
                    callback
                }
            ],
            content: content,
            rejectClose: false,
            modal: false,
            window: {
                title: _loc('DAGGERHEART.ACTIONS.Config.damage.addResource')
            },
            position: { width: 300 }
        });

        typeDialog.render(true);
    }

    /** @this DHActionBaseConfig */
    static #onRemoveDamageResource(_event, button) {
        if (!this.action.damage?.resources) return;
        const data = this.action.toObject();
        const key = button.dataset.key;
        data.damage.resources[key] = _del;
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
            const button = element.querySelector('.expand-trigger > i');
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

    static async addBeastformTraitBonus() {
        const data = this.action.toObject();
        data.beastform.modifications.traitBonuses = [
            ...data.beastform.modifications.traitBonuses,
            this.action.schema.fields.beastform.fields.modifications.fields.traitBonuses.element.getInitialValue()
        ];
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    static async removeBeastformTraitBonus(_event, button) {
        const data = this.action.toObject();
        data.beastform.modifications.traitBonuses.splice(button.dataset.index, 1);
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** 
     * Update the count of tokens to be created for a single actor type in a summon action 
     * @param {Event} event 
     */
    #onUpdateSummonCount(event) {
        event.stopPropagation();
        const wrapper = event.target.closest('.summon-count-wrapper');
        const index = wrapper.dataset.index;
        const data = this.action.toObject();
        data.summon[index].count = event.target.value;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /**
     * Update the state of resource refresh on a transform action
     * @param {Event} event 
     */
    #onUpdateTransformResource(event) {
        event.stopPropagation();

        const data = this.action.toObject();
        data.transform.resourceRefresh[event.target.dataset.resource] = event.target.checked;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** Update the state of resource refresh on an evolution action
     * @param {Event} event 
     */
    #onUpdateEvolutionResource(event) {
        event.stopPropagation();

        const data = this.action.toObject();
        data.evolution.resourceRefresh[event.target.dataset.resource] = event.target.checked;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** Update the evolution state on features for an evolution action.
     *  This decides which are available before/after evolution.
     * @param {Event} event 
     */
    #onUpdateEvolutionStateSelect(event) {
        event.stopPropagation();

        const value = event.target.value ? event.target.value : _del();
        const data = this.action.toObject();
        data.evolution.evolutionFeatures[event.target.dataset.id] = value;
        this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(data) });
    }

    /** Specific implementation in extending classes **/
    static async addEffect(_event) { }
    static removeEffect(_event, _button) { }
    static editEffect(_event) { }

    async close(options) {
        this.tabGroups.primary = 'base';
        await super.close(options);
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.getDragEventData(event);
        const entity = await foundry.utils.fromUuid(data.uuid);

        const dropZone = event.target.closest('[data-is-drop-zone]');
        if (!dropZone) return;

        switch (dropZone.id) {
            case 'summon-drop-zone':
                return this.onSummonDrop(entity);
            case 'transform-drop-zone':
                return this.onTransformDrop(entity);
        }
    }

    /**
     * Handles the logic of dropped actors on summon actions
     * @param {game.system.api.documents.DhpActor} actor 
     */
    async onSummonDrop(actor) {
        if (!(actor instanceof game.system.api.documents.DhpActor)) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.summon.invalidDrop'));
            return;
        }

        const actionData = this.action.toObject();
        const existingSummon = actionData.summon.find(x => x.actorUUID === actor.uuid);
        if (existingSummon) {
            existingSummon.count++;
            return await this.constructor.updateForm.bind(this)(null, null, {
                object: foundry.utils.flattenObject(actionData)
            });
        }

        actionData.summon.push({ actorUUID: actor.uuid, count: 1 });
        await this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(actionData) });
    }

    /**
     * Handles the logic of dropped actors on transform actions
     * @param {game.system.api.documents.DhpActor} actor 
     */
    async onTransformDrop(actor) {
        if (!(actor instanceof game.system.api.documents.DhpActor)) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.invalidDrop'));
            return;
        }

        const actionData = this.action.toObject();
        actionData.transform.actorUUID = actor.uuid;
        await this.constructor.updateForm.bind(this)(null, null, { object: foundry.utils.flattenObject(actionData) });
    }
}
