export default class DhCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
    static DEFAULT_OPTIONS = {
        actions: {
            takeSpotlight: this.takeSpotlight
        }
    };

    static PARTS = {
        header: {
            template: 'systems/daggerheart/templates/ui/combat/combatTrackerHeader.hbs'
        },
        tracker: {
            template: 'systems/daggerheart/templates/ui/combat/combatTracker.hbs'
        },
        footer: {
            template: 'systems/daggerheart/templates/ui/combat/combatTrackerFooter.hbs'
        }
    };

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

    static async takeSpotlight(_, target) {
        const { combatantId } = target.closest('[data-combatant-id]')?.dataset ?? {};
        for (var combatant of this.viewed.combatants) {
            await combatant.update({ 'system.active': combatantId === combatant.id ? true : false });
        }

        this.render();
    }
}
