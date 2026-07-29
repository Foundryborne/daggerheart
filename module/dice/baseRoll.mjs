export default class BaseRoll extends Roll {
    /** @inheritdoc */
    static CHAT_TEMPLATE = 'systems/daggerheart/templates/ui/chat/foundryRoll.hbs';

    /** @inheritdoc */
    static TOOLTIP_TEMPLATE = 'systems/daggerheart/templates/ui/chat/foundryRollTooltip.hbs';

    get modifierTotal() {
        return this.total - this.dice.reduce((acc, dice) => acc + dice.total, 0);
    }
}
