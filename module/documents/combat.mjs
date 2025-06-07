export default class DhpCombat extends Combat {
    async startCombat() {
        this._playCombatSound('startEncounter');
        const updateData = { round: 1, turn: null };
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
