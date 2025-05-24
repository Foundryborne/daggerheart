export default class DhpChatMesssage extends ChatMessage {
    async renderHTML() {
        if (
            this.type === 'dualityRoll' ||
            this.type === 'adversaryRoll' ||
            this.type === 'damageRoll' ||
            this.type === 'abilityUse'
        ) {
            this.content = await foundry.applications.handlebars.renderTemplate(this.content, this.system);
        }

        return super.renderHTML();
    }
}
