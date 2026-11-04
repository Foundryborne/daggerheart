import { DHDamageData } from '../../data/fields/action/damageField.mjs';
import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/** 
 * @typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction
 * @import { DhAdversary } from '../../data/actor/_module.mjs';
 */

/** @extends {DHBaseActorSettings<DhActor<DhAdversary>>} */
export default class DHAdversarySettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['adversary-settings'],
        position: { width: 455, height: 'auto' },
        actions: {
            addExperience: this.#onAddExperience,
            removeExperience: this.#onRemoveExperience,
            addAttack: this.#onAddAttack,
            removeAttack: this.#onRemoveAttack,
            addDamage: this.#onAddDamage,
            removeDamage: this.#onRemoveDamage,
            removeCollosusPart: this.#onRemoveCollosusPart
        }
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/details.hbs'
        },
        parts: {
            id: 'parts',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/parts.hbs'
        },
        attack: {
            id: 'attack',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/attack.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/experiences.hbs',
            scrollable: ['.scroll-container']
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/features.hbs',
            scrollable: ['']
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'parts' }, { id: 'attack' }, { id: 'experiences' }, { id: 'features' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /** @inheritdoc */
    _prepareTabs(group) {
        const result = super._prepareTabs(group);

        const actor = this.actor;
        const isCollosus = actor.system.typeData?.type === 'collosus';
        const collosusRole = isCollosus ? actor.system.typeData.role : null;
        if (group === 'primary') {
            if (collosusRole !== 'framework') delete result.parts;
            if (collosusRole === 'part') delete result.experiences;
        }
        
        return result;
    }

    /** @inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Get feature groups. Uncategorized go to actions
        const featureFormsTypes = ['passive', 'action', 'reaction'];
        const features = this.document.system.features.sort((a, b) => a.sort - b.sort);
        const featureGroups = featureFormsTypes.map(t => ({
            featureForm: t,
            label: _loc(CONFIG.DH.ITEM.featureForm[t]),
            features: features.filter(f => f.system.featureForm === t)
        }));
        featureGroups[1].features.push(...features.filter(f => !featureFormsTypes.includes(f.system.featureForm)));
        context.featureGroups = featureGroups;
        context.typeDataFields = this.document.system.typeData ? 
            context.systemFields.typeData.types[this.document.system.typeData.type]?.fields : null;

        // Filter out data that is not configurable for collosi
        // These still exist under the hood, but its more user friendly to exclude
        if (this.actor.system.typeData?.type === 'collosus') {
            const role = this.actor.system.typeData.role;
            context.resources = context.resources.filter(r => role === 'framework' ? r.key !== 'hitPoints' : r.key !== 'stress');
        }

        return context;
    }

    /** @inheritdoc */
    async _preparePartContext(partId, context) {
        context = await super._preparePartContext(partId, context);
        const actor = this.actor;
        switch (partId) {
            case 'parts': {
                context.parts = await Promise.all(
                    actor.system.typeData?.parts.map(async p => ({ ...p, actor: await fromUuid(p.uuid) })) ?? []
                );
            }
        }
        return context;
    }

    _attachPartListeners(partId, htmlElement) {
        super._attachPartListeners(partId, htmlElement);

        for (const element of htmlElement.querySelectorAll('input[data-part-quantity]')) {
            element.addEventListener('blur', () => {
                const idx = Number(element.closest('[data-idx]').dataset.idx);
                const parts = this.actor.system.toObject()?.typeData?.parts ?? [];
                parts[idx].quantity = Number(element.value);
                this.actor.update({ 'system.typeData.parts': parts });
            })
        }
    }

    async _processSubmitData(event, form, submitData, options) {
        // If the user is changing type, they may risk deleting certain data. Warn if that will happen.
        const actor = this.actor;
        if (actor.system.typeData && submitData.system?.type && submitData.system?.type !== actor.system.type) {
            const confirm = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: _loc('DAGGERHEART.ACTORS.Adversary.changeType.title')
                },
                content: _loc('DAGGERHEART.ACTORS.Adversary.changeType.content')
            });
            if (!confirm) {
                this.render();
                return;
            }
        }
        return super._processSubmitData(event, form, submitData, options);
    }

    /**
     * 
     * @param {DragEvent} event 
     * @param {DhActor} document 
     * @returns 
     */
    async _onDropActor(event, document) {
        const tab = event.target.closest('.tab');
        if (tab.dataset.tab === 'parts') {
            const typeData = document.system.typeData;
            const isPart = typeData?.type === 'collosus' && typeData.role == 'part';
            if (!isPart) {
                ui.notifications.warn('Only Collosi Parts can be added to the parts list')
                return false;
            }

            const uuid = document.uuid;
            const parts = foundry.utils.deepClone(this.actor.system.toObject().typeData?.parts ?? []);
            if (parts.some(p => p.uuid === uuid)) {
                ui.notifications.warn('This Collosi Part was already added added');
                return false;
            } 
            parts.push({ uuid: document.uuid, quantity: 1 });
            return this.actor.update({ 'system.typeData.parts': parts });
        }

        return super._onDropActor(event, document)
    }

    /* -------------------------------------------- */

    /**
     * Adds a new experience entry to the actor.
     * @type {ApplicationClickAction}
     */
    static async #onAddExperience() {
        const newExperience = {
            name: 'Experience',
            modifier: 0
        };
        await this.actor.update({ [`system.experiences.${foundry.utils.randomID()}`]: newExperience });
    }

    /**
     * Removes an experience entry from the actor.
     * @type {ApplicationClickAction}
     */
    static async #onRemoveExperience(_, target) {
        const experience = this.actor.system.experiences[target.dataset.experience];
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                    type: game.i18n.localize(`DAGGERHEART.GENERAL.Experience.single`),
                    name: experience.name
                })
            },
            content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: experience.name })
        });
        if (!confirmed) return;

        await this.actor.update({ [`system.experiences.${target.dataset.experience}`]: _del });
    }

    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static #onAddDamage() {
        this.actor.update({
            'system.attack.damage.main': {
                ...DHDamageData.schema.getInitialValue(),
                applyTo: 'hitPoints',
                type: 'physical'
            }
        });
    }
    
    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static #onRemoveDamage() {
        this.actor.update({
            'system.attack.damage.main': null
        });
    }

    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static #onAddAttack() {
        this.actor.update({
            'system.attack': _replace(this.document.system.schema.fields.attack.getInitialValue())
        })
    }

    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static async #onRemoveAttack(event) {
        const confirm = event.shiftKey 
            || await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: _loc('COMMON.AreYouSure')
                },
                content: _loc('DAGGERHEART.ACTORS.Adversary.confirmDeleteAttack')
            });

        if (confirm) {
            this.actor.update({ 'system.attack': null });
        }
    }

    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static async #onRemoveCollosusPart(event) {
        const index = event.target.closest('[data-idx]').dataset.idx;
        if (Number.isNumeric(index)) {
            const parts = this.actor.system.toObject().typeData?.parts ?? [];
            parts.splice(Number(index), 1);
            this.actor.update({ 'system.typeData.parts': parts });
        }
    }
}
