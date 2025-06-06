export default class DhpCombat extends Combat {
    get combatant() {
        return this.combatants.contents.find(x => x.system.active) ?? null;
    }

    async startCombat() {
        this._playCombatSound('startEncounter');
        const updateData = { 'system.started': true };
        Hooks.callAll('combatStart', this, updateData);
        await this.update(updateData);
        return this;
    }

    _sortCombatants(a, b) {
        const aNPC = Number(a.isNPC);
        const bNPC = Number(b.isNPC);
        if (aNPC !== bNPC) {
            return aNPC - bNPC;
        }

        return a.name.localeCompare(b.name);
    }

    // async useActionToken(combatantId) {
    //     const automateActionPoints = await game.settings.get(
    //         SYSTEM.id,
    //         SYSTEM.SETTINGS.gameSettings.Automation.ActionPoints
    //     );

    //     if (game.user.isGM) {
    //         if (this.system.actions < 1) return;

    //         const update = automateActionPoints
    //             ? { 'system.activeCombatant': combatantId, 'system.actions': Math.max(this.system.actions - 1, 0) }
    //             : { 'system.activeCombatant': combatantId };

    //         await this.update(update);
    //     } else {
    //         const update = automateActionPoints
    //             ? { 'system.activeCombatant': combatantId, 'system.actions': this.system.actions + 1 }
    //             : { 'system.activeCombatant': combatantId };

    //         await game.socket.emit(`system.${SYSTEM.id}`, {
    //             action: socketEvent.GMUpdate,
    //             data: {
    //                 action: GMUpdateEvent.UpdateDocument,
    //                 uuid: this.uuid,
    //                 update: update
    //             }
    //         });
    //     }
    // }
}
