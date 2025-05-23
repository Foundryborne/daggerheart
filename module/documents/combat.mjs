import { GMUpdateEvent, socketEvent } from '../helpers/socket.mjs';

export default class DhpCombat extends Combat {
    _sortCombatants(a, b) {
        if (a.isNPC !== b.isNPC) {
            const aVal = a.isNPC ? 0 : 1;
            const bVal = b.isNPC ? 0 : 1;

            return aVal - bVal;
        }

        return a.name.localeCompare(b.name);
    }

    async useActionToken(combatantId) {
        const automateActionPoints = await game.settings.get(
            SYSTEM.id,
            SYSTEM.SETTINGS.gameSettings.Automation.ActionPoints
        );

        if (game.user.isGM) {
            if (this.system.actions < 1) return;

            const update = automateActionPoints
                ? { 'system.activeCombatant': combatantId, 'system.actions': Math.max(this.system.actions - 1, 0) }
                : { 'system.activeCombatant': combatantId };

            await this.update(update);
        } else {
            const update = automateActionPoints
                ? { 'system.activeCombatant': combatantId, 'system.actions': this.system.actions + 1 }
                : { 'system.activeCombatant': combatantId };

            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateDocument,
                    uuid: this.uuid,
                    update: update
                }
            });
        }
    }
}
