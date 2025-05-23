import { GMUpdateEvent, socketEvent } from '../helpers/socket.mjs';

export default class DhpCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
    constructor(data, context) {
        super(data, context);

        Hooks.on(socketEvent.DhpFearUpdate, this.onFearUpdate);
    }

    get template() {
        return 'systems/daggerheart/templates/ui/combatTracker.hbs';
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on('click', '.token-action-tokens .use-action-token', this.useActionToken.bind(this));
        html.on('click', '.encounter-gm-resources .trade-actions', this.tradeActions.bind(this));
        html.on('click', '.encounter-gm-resources .trade-fear', this.tradeFear.bind(this));
        html.on('click', '.encounter-gm-resources .icon-button.up', this.increaseResource.bind(this));
        html.on('click', '.encounter-gm-resources .icon-button.down', this.decreaseResource.bind(this));
    }

    async useActionToken(event) {
        event.stopPropagation();
        const combatant = event.currentTarget.dataset.combatant;
        await game.combat.useActionToken(combatant);
    }

    async tradeActions(event) {
        if (event.currentTarget.classList.contains('disabled')) return;

        const currentFear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);
        const value = currentFear + 1;

        if (value <= 6) {
            Hooks.callAll(socketEvent.GMUpdate, GMUpdateEvent.UpdateFear, null, value);
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: { action: GMUpdateEvent.UpdateFear, update: value }
            });
            await game.combat.update({ 'system.actions': game.combat.system.actions - 2 });
        }
    }

    async tradeFear() {
        if (event.currentTarget.classList.contains('disabled')) return;

        const currentFear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);
        const value = currentFear - 1;
        if (value >= 0) {
            Hooks.callAll(socketEvent.GMUpdate, GMUpdateEvent.UpdateFear, null, value);
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: { action: GMUpdateEvent.UpdateFear, update: value }
            });
            await game.combat.update({ 'system.actions': game.combat.system.actions + 2 });
        }
    }

    async increaseResource(event) {
        if (event.currentTarget.dataset.type === 'action') {
            await game.combat.update({ 'system.actions': game.combat.system.actions + 1 });
        }

        const currentFear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);
        const value = currentFear + 1;
        if (event.currentTarget.dataset.type === 'fear' && value <= 6) {
            Hooks.callAll(socketEvent.GMUpdate, GMUpdateEvent.UpdateFear, null, value);
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: { action: GMUpdateEvent.UpdateFear, update: value }
            });
        }

        this.render();
    }

    async decreaseResource(event) {
        if (event.currentTarget.dataset.type === 'action' && game.combat.system.actions - 1 >= 0) {
            await game.combat.update({ 'system.actions': game.combat.system.actions - 1 });
        }

        const currentFear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);
        const value = currentFear - 1;
        if (event.currentTarget.dataset.type === 'fear' && value >= 0) {
            Hooks.callAll(socketEvent.GMUpdate, GMUpdateEvent.UpdateFear, null, value);
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: { action: GMUpdateEvent.UpdateFear, update: value }
            });
        }

        this.render();
    }

    async getData(options = {}) {
        let context = await super.getData(options);

        // Get the combat encounters possible for the viewed Scene
        const combat = this.viewed;
        const hasCombat = combat !== null;
        const combats = this.combats;
        const currentIdx = combats.findIndex(c => c === combat);
        const previousId = currentIdx > 0 ? combats[currentIdx - 1].id : null;
        const nextId = currentIdx < combats.length - 1 ? combats[currentIdx + 1].id : null;
        const settings = game.settings.get('core', Combat.CONFIG_SETTING);

        // Prepare rendering data
        context = foundry.utils.mergeObject(context, {
            combats: combats,
            currentIndex: currentIdx + 1,
            combatCount: combats.length,
            hasCombat: hasCombat,
            combat,
            turns: [],
            previousId,
            nextId,
            started: this.started,
            control: false,
            settings,
            linked: combat?.scene !== null,
            labels: {}
        });
        context.labels.scope = game.i18n.localize(`COMBAT.${context.linked ? 'Linked' : 'Unlinked'}`);
        if (!hasCombat) return context;

        // Format information about each combatant in the encounter
        let hasDecimals = false;
        const turns = [];
        for (let [i, combatant] of combat.turns.entries()) {
            if (!combatant.visible) continue;

            // Prepare turn data
            const resource =
                combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null;
            const turn = {
                id: combatant.id,
                name: combatant.name,
                img: await this._getCombatantThumbnail(combatant),
                active: combatant.id === combat.system.activeCombatant,
                owner: combatant.isOwner,
                defeated: combatant.isDefeated,
                hidden: combatant.hidden,
                initiative: combatant.initiative,
                hasRolled: combatant.initiative !== null,
                hasResource: resource !== null,
                resource: resource,
                canPing: combatant.sceneId === canvas.scene?.id && game.user.hasPermission('PING_CANVAS'),
                playerCharacter: game.user?.character?.id === combatant.actor.id,
                ownedByPlayer: combatant.hasPlayerOwner
            };
            if (turn.initiative !== null && !Number.isInteger(turn.initiative)) hasDecimals = true;
            turn.css = [turn.active ? 'active' : '', turn.hidden ? 'hidden' : '', turn.defeated ? 'defeated' : '']
                .join(' ')
                .trim();

            // Actor and Token status effects
            turn.effects = new Set();
            if (combatant.token) {
                combatant.token.effects.forEach(e => turn.effects.add(e));
                if (combatant.token.overlayEffect) turn.effects.add(combatant.token.overlayEffect);
            }
            if (combatant.actor) {
                for (const effect of combatant.actor.temporaryEffects) {
                    if (effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED)) turn.defeated = true;
                    else if (effect.icon) turn.effects.add(effect.icon);
                }
            }
            turns.push(turn);
        }

        // Format initiative numeric precision
        const precision = CONFIG.Combat.initiative.decimals;
        turns.forEach(t => {
            if (t.initiative !== null) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
        });

        const fear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);

        // Merge update data for rendering
        return foundry.utils.mergeObject(context, {
            round: combat.round,
            turn: combat.turn,
            turns: turns,
            control: combat.combatant?.players?.includes(game.user),
            fear: fear
        });
    }

    onFearUpdate = async () => {
        this.render(true);
    };

    async close(options) {
        Hooks.off(socketEvent.DhpFearUpdate, this.onFearUpdate);

        return super.close(options);
    }
}
