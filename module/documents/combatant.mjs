export default class DhCombatant extends Combatant {
    /**@inheritdoc */
    get isNPC() {
        return this.actor?.isNPC ?? (!this.actor || !this.hasPlayerOwner);
    }
}
