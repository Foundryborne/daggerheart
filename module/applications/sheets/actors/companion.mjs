import DhCompanionLevelUp from '../../levelup/companionLevelup.mjs';
import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DhCompanionSheet extends DHBaseActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['actor', 'companion'],
        position: { width: 340 },
        actions: {
            levelManagement: DhCompanionSheet.#levelManagement
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/companion/header.hbs' },
        details: { template: 'systems/daggerheart/templates/sheets/actors/companion/details.hbs' },
        effects: {
            template: 'systems/daggerheart/templates/sheets/actors/companion/effects.hbs',
            scrollable: ['.effects-sections']
        }
    };

    /* -------------------------------------------- */

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'effects' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element
            .querySelector('.level-value')
            ?.addEventListener('change', event => this.document.updateLevel(Number(event.currentTarget.value)));
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Opens the companions level management window.
     * @type {ApplicationClickAction}
     */
    static #levelManagement() {
        new DhCompanionLevelUp(this.document).render({ force: true });
    }
}
