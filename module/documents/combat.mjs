export default class DhpCombat extends Combat {
    get combatant() {
        return this.combatants.contents.find(x => x.system.spotlight.active) ?? null;
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
}
