import DhCompanionLevelUp from '../../levelup/companionLevelup.mjs';
import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DhCompanionSheet extends DHBaseActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['actor', 'companion'],
        position: { width: 340 },
        actions: {
            actionRoll: DhCompanionSheet.#actionRoll,
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
     *
     */
    static async #actionRoll(event) {
        const partner = this.actor.system.partner;
        const config = {
            event,
            title: `${game.i18n.localize('DAGGERHEART.GENERAL.Roll.action')}: ${this.actor.name}`,
            headerTitle: `Companion ${game.i18n.localize('DAGGERHEART.GENERAL.Roll.action')}`,
            roll: {
                trait: partner.system.spellcastModifierTrait?.key
            },
            hasRoll: true,
            data: partner.getRollData()
        };

        const result = await partner.diceRoll(config);
        this.consumeResource(result?.costs);
    }

    // Remove when Action Refactor part #2 done
    async consumeResource(costs) {
        if (!costs?.length) return;

        const partner = this.actor.system.partner;
        const usefulResources = {
            ...foundry.utils.deepClone(partner.system.resources),
            fear: {
                value: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear),
                max: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxFear,
                reversed: false
            }
        };
        const resources = game.system.api.fields.ActionFields.CostField.getRealCosts(costs).map(c => {
            const resource = usefulResources[c.key];
            return {
                key: c.key,
                value: (c.total ?? c.value) * (resource.isReversed ? 1 : -1),
                target: resource.target,
                keyIsID: resource.keyIsID
            };
        });

        await partner.modifyResource(resources);
    }

    /**
     * Opens the companions level management window.
     * @type {ApplicationClickAction}
     */
    static #levelManagement() {
        new DhCompanionLevelUp(this.document).render({ force: true });
    }
}
