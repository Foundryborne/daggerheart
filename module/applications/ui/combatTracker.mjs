import { EncounterCountdowns } from '../ui/countdowns.mjs';

export default class DhCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
    static DEFAULT_OPTIONS = {
        actions: {
            requestSpotlight: this.requestSpotlight,
            toggleSpotlight: this.toggleSpotlight,
            setActionTokens: this.setActionTokens,
            openCountdowns: this.openCountdowns
        }
    };

    static PARTS = {
        header: {
            template: 'systems/daggerheart/templates/ui/combatTracker/combatTrackerHeader.hbs'
        },
        tracker: {
            template: 'systems/daggerheart/templates/ui/combatTracker/combatTracker.hbs'
        },
        footer: {
            template: 'systems/daggerheart/templates/ui/combatTracker/combatTrackerFooter.hbs'
        }
    };

    async _prepareCombatContext(context, options) {
        await super._prepareCombatContext(context, options);

        Object.assign(context, {
            fear: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear)
        });
    }

    async _prepareTrackerContext(context, options) {
        await super._prepareTrackerContext(context, options);

        const adversaries = context.turns?.filter(x => x.isNPC) ?? [];
        const characters = context.turns?.filter(x => !x.isNPC) ?? [];

        Object.assign(context, {
            actionTokens: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).actionTokens,
            adversaries,
            characters
        });
    }

    async _prepareTurnContext(combat, combatant, index) {
        const turn = await super._prepareTurnContext(combat, combatant, index);
        return { ...turn, isNPC: combatant.isNPC, system: combatant.system.toObject() };
    }

    _getCombatContextOptions() {
        return [
            {
                name: 'COMBAT.ClearMovementHistories',
                icon: '<i class="fa-solid fa-shoe-prints"></i>',
                condition: () => game.user.isGM && this.viewed?.combatants.size > 0,
                callback: () => this.viewed.clearMovementHistories()
            },
            {
                name: 'COMBAT.Delete',
                icon: '<i class="fa-solid fa-trash"></i>',
                condition: () => game.user.isGM && !!this.viewed,
                callback: () => this.viewed.endCombat()
            }
        ];
    }

    async setCombatantSpotlight(combatantId) {
        const update = {
            system: {
                'spotlight.requesting': false
            }
        };
        const combatant = this.viewed.combatants.get(combatantId);

        const toggleTurn = this.viewed.combatants.contents
            .sort(this.viewed._sortCombatants)
            .map(x => x.id)
            .indexOf(combatantId);

        if (this.viewed.turn !== toggleTurn) {
            const { updateCountdowns } = game.system.api.applications.ui.DhCountdowns;
            await updateCountdowns(CONFIG.DH.GENERAL.countdownTypes.spotlight.id);

            const autoPoints = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).actionPoints;
            if (autoPoints) {
                update.system.actionTokens = Math.max(combatant.system.actionTokens - 1, 0);
            }
        }

        await this.viewed.update({
            turn: this.viewed.turn === toggleTurn ? null : toggleTurn,
            round: this.viewed.round + 1
        });
        await combatant.update(update);
    }

    static async requestSpotlight(_, target) {
        const { combatantId } = target.closest('[data-combatant-id]')?.dataset ?? {};
        const combatant = this.viewed.combatants.get(combatantId);
        await combatant.update({
            'system.spotlight': {
                requesting: !combatant.system.spotlight.requesting
            }
        });

        this.render();
    }

    static async toggleSpotlight(_, target) {
        const { combatantId } = target.closest('[data-combatant-id]')?.dataset ?? {};
        await this.setCombatantSpotlight(combatantId);
    }

    static async setActionTokens(_, target) {
        const { combatantId, tokenIndex } = target.closest('[data-combatant-id]')?.dataset ?? {};

        const combatant = this.viewed.combatants.get(combatantId);
        const changeIndex = Number(tokenIndex);
        const newIndex = combatant.system.actionTokens > changeIndex ? changeIndex : changeIndex + 1;

        await combatant.update({ 'system.actionTokens': newIndex });
        this.render();
    }

    static openCountdowns() {
        new EncounterCountdowns().open();
    }
}
