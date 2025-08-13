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

    getDefeatedId(combatant) {
        if (!combatant.actor) return CONFIG.specialStatusEffects.DEFEATED;

        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).defeated;
        return settings[`${combatant.actor.type}Default`];
    }

    /** @inheritdoc */
    async _onToggleDefeatedStatus(combatant) {
        const isDefeated = !combatant.isDefeated;
        await combatant.update({ defeated: isDefeated });
        await combatant.actor?.toggleStatusEffect(this.getDefeatedId(combatant), { overlay: true, active: isDefeated });
    }

    /** @inheritdoc */
    async _prepareTurnContext(combat, combatant, index) {
        const { id, name, isOwner, isDefeated, hidden, initiative, permission } = combatant;
        const resource = permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null;
        const hasDecimals = Number.isFinite(initiative) && !Number.isInteger(initiative);
        const turn = {
            hasDecimals,
            hidden,
            id,
            isDefeated,
            initiative,
            isOwner,
            name,
            resource,
            active: index === combat.turn,
            canPing: combatant.sceneId === canvas.scene?.id && game.user.hasPermission('PING_CANVAS'),
            img: await this._getCombatantThumbnail(combatant)
        };

        turn.css = [turn.active ? 'active' : null, hidden ? 'hide' : null, isDefeated ? 'defeated' : null].filterJoin(
            ' '
        );

        const defeatedId = this.getDefeatedId(combatant);
        const effects = [];
        for (const effect of combatant.actor?.temporaryEffects ?? []) {
            if (effect.statuses.has(defeatedId)) turn.isDefeated = true;
            else if (effect.img) effects.push({ img: effect.img, name: effect.name });
        }
        turn.effects = {
            icons: effects,
            tooltip: this._formatEffectsTooltip(effects)
        };

        return turn;
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
