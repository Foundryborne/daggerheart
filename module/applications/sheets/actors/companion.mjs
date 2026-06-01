import { getDocFromElement } from '../../../helpers/utils.mjs';
import DhCompanionLevelUp from '../../levelup/companionLevelup.mjs';
import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DhCompanionSheet extends DHBaseActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['actor', 'companion'],
        position: { width: 340 },
        actions: {
            toggleStress: DhCompanionSheet.#toggleStress,
            actionRoll: DhCompanionSheet.#actionRoll,
            levelManagement: DhCompanionSheet.#levelManagement
        },
        contextMenus: [
            {
                handler: DhCompanionSheet.#getAttackContextOptions,
                selector: '[data-item-uuid][data-type="attack"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            }
        ]
    };

    static PARTS = {
        limited: {
            template: 'systems/daggerheart/templates/sheets/actors/companion/limited.hbs',
            scrollable: ['.limited-container']
        },
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

    /* -------------------------------------------- */
    /*  Context Menu                                */
    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options for the companion's attack.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {CharacterSheet}
     * @protected
     */
    static #getAttackContextOptions() {
        /**@type {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} */
        return [
            {
                label: 'DAGGERHEART.CONFIG.RollTypes.attack.name',
                icon: 'fa-solid fa-burst',
                onClick: async (event, target) => (await getDocFromElement(target)).use(event)
            },
            {
                label: 'DAGGERHEART.GENERAL.damage',
                icon: 'fa-solid fa-explosion',
                onClick: async (event, target) => {
                    const doc = await getDocFromElement(target),
                        action = doc?.system?.attack ?? doc;
                    const config = action.prepareConfig(event);
                    config.effects = await game.system.api.data.actions.actionsTypes.base.getEffects(
                        this.document,
                        doc
                    );
                    config.hasRoll = false;
                    return action && action.workflow.get('damage').execute(config, null, true);
                }
            },
            {
                label: 'DAGGERHEART.APPLICATIONS.ContextMenu.sendToChat',
                icon: 'fa-solid fa-message',
                onClick: async (_, target) => (await getDocFromElement(target)).toChat(this.document.uuid)
            }
        ];
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Toggles stress resource value.
     * @type {ApplicationClickAction}
     */
    static async #toggleStress(_, button) {
        const StressValue = Number.parseInt(button.dataset.value);
        const newValue = this.document.system.resources.stress.value >= StressValue ? StressValue - 1 : StressValue;
        await this.document.update({ 'system.resources.stress.value': newValue });
    }

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
                trait: partner.system.spellcastModifierTrait?.key,
                companionRoll: true
            },
            hasRoll: true
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
                target: resource.target
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
