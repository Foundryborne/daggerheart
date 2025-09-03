import DHBaseActorSheet from '../api/base-actor.mjs';
import { getDocFromElement } from '../../../helpers/utils.mjs';

export default class Party extends DHBaseActorSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['party'],
        position: {
            width: 550
        },
        window: {
            resizable: true
        },
        actions: {
            deletePartyMember: Party.#deletePartyMember,
            toggleHope: Party.#toggleHope,
            toggleHitPoints: Party.#toggleHitPoints,
            toggleStress: Party.#toggleStress,
            toggleArmorSlot: Party.#toggleArmorSlot
        },
        dragDrop: [{ dragSelector: '.actors-section .inventory-item', dropSelector: null }]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/party/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        partyMembers: { template: 'systems/daggerheart/templates/sheets/actors/party/party-members.hbs' },
        resources: {
            template: 'systems/daggerheart/templates/sheets/actors/party/resources.hbs',
            scrollable: ['.resources']
        },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/party/notes.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'partyMembers' }, { id: 'resources' }, { id: 'notes' }],
            initial: 'partyMembers',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'header':
                await this._prepareHeaderContext(context, options);
                break;
            case 'notes':
                await this._prepareNotesContext(context, options);
                break;
        }
        return context;
    }

    /**
     * Prepare render context for the Header part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareHeaderContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        context.description = await TextEditor.implementation.enrichHTML(system.description, {
            secrets: this.document.isOwner,
            relativeTo: this.document
        });
    }

    /**
     * Prepare render context for the Biography part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareNotesContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        const paths = {
            notes: 'notes'
        };

        for (const [key, path] of Object.entries(paths)) {
            const value = foundry.utils.getProperty(system, path);
            context[key] = {
                field: system.schema.getField(path),
                value,
                enriched: await TextEditor.implementation.enrichHTML(value, {
                    secrets: this.document.isOwner,
                    relativeTo: this.document
                })
            };
        }
    }

    /**
     * Toggles a hope resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleHope(_, target) {
        const hopeValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.hope.value >= hopeValue ? hopeValue - 1 : hopeValue;
        await actor.update({ 'system.resources.hope.value': newValue });
        this.render();
    }

    /**
     * Toggles a hp resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleHitPoints(_, target) {
        const hitPointsValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.hitPoints.value >= hitPointsValue ? hitPointsValue - 1 : hitPointsValue;
        await actor.update({ 'system.resources.hitPoints.value': newValue });
        this.render();
    }

    /**
     * Toggles a stress resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleStress(_, target) {
        const stressValue = Number.parseInt(target.dataset.value);
        const actor = await foundry.utils.fromUuid(target.dataset.actorId);
        const newValue = actor.system.resources.stress.value >= stressValue ? stressValue - 1 : stressValue;
        await actor.update({ 'system.resources.stress.value': newValue });
        this.render();
    }

    /**
     * Toggles a armor slot resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleArmorSlot(_, target, element) {
        const armorItem = await foundry.utils.fromUuid(target.dataset.itemUuid);
        const armorValue = Number.parseInt(target.dataset.value);
        const newValue = armorItem.system.marks.value >= armorValue ? armorValue - 1 : armorValue;
        await armorItem.update({ 'system.marks.value': newValue });
        this.render();
    }

    /* -------------------------------------------- */

    async _onDragStart(event) {
        const item = event.currentTarget.closest('.inventory-item');

        if (item) {
            const adversaryData = { type: 'Actor', uuid: item.dataset.itemUuid };
            event.dataTransfer.setData('text/plain', JSON.stringify(adversaryData));
            event.dataTransfer.setDragImage(item, 60, 0);
        }
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const actor = await foundry.utils.fromUuid(data.uuid);
        const currentMembers = this.document.system.partyMembers.map(x => x.uuid);

        if (foundry.utils.parseUuid(data.uuid).collection instanceof CompendiumCollection) return;

        if (actor.type !== 'character') {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.onlyCharactersInPartySheet'));
        }

        if (currentMembers.includes(data.uuid)) {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.duplicateCharacter'));
        }

        await this.document.update({ 'system.partyMembers': [...currentMembers, actor.uuid] });
    }

    static async #deletePartyMember(_event, target) {
        const doc = await getDocFromElement(target.closest('.inventory-item'));

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                    type: game.i18n.localize('TYPES.Actor.adversary'),
                    name: doc.name
                })
            },
            content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: doc.name })
        });

        if (!confirmed) return;

        const currentMembers = this.document.system.partyMembers.map(x => x.uuid);
        const newMemberdList = currentMembers.filter(uuid => uuid !== doc.uuid);
        await this.document.update({ 'system.partyMembers': newMemberdList });
    }
}
