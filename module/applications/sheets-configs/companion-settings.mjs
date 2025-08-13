import { GMUpdateEvent, socketEvent } from '../../systemRegistration/socket.mjs';
import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DHCompanionSettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['companion-settings'],
        position: { width: 455, height: 'auto' },
        actions: {
            addExperience: DHCompanionSettings.#addExperience,
            removeExperience: DHCompanionSettings.#removeExperience
        }
    };

    /**@inheritdoc */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/companion-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/companion-settings/details.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets-settings/companion-settings/experiences.hbs'
        },
        attack: {
            id: 'attack',
            template: 'systems/daggerheart/templates/sheets-settings/companion-settings/attack.hbs'
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'attack' }, { id: 'experiences' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    async _onRender(context, options) {
        await super._onRender(context, options);
        this.element.querySelector('.partner-value')?.addEventListener('change', this.onPartnerChange.bind(this));
    }

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.playerCharacters = game.actors
            .filter(x => x.type === 'character' && (x.isOwner || this.document.system.partner?.uuid === x.uuid))
            .map(x => ({ key: x.uuid, name: x.name }));

        return context;
    }

    /**
     * Handles changes to the actor's partner selection.
     * @param {Event} event - The change event triggered by the partner input element.
     */
    async onPartnerChange(event) {
        const value = event.target.value;
        const partnerDocument = value ? await foundry.utils.fromUuid(value) : this.actor.system.partner;
        const partnerUpdate = { 'system.companion': value ? this.actor.uuid : null };

        if (!partnerDocument.isOwner) {
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateDocument,
                    uuid: partnerDocument.uuid,
                    update: partnerUpdate
                }
            });
        } else {
            await partnerDocument.update(partnerUpdate);
        }

        await this.actor.update({ 'system.partner': value });

        if (!value) await this.actor.updateLevel(1);
    }

    /**
     * Adds a new experience entry to the actor.
     * @type {ApplicationClickAction}
     */
    static async #addExperience() {
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
    static async #removeExperience(_, target) {
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

        await this.actor.update({ [`system.experiences.-=${target.dataset.experience}`]: null });
    }
}
