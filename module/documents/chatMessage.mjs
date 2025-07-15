export default class DhpChatMessage extends foundry.documents.ChatMessage {
    async renderHTML() {
        if (this.system.messageTemplate)
            this.content = await foundry.applications.handlebars.renderTemplate(
                this.system.messageTemplate,
                this.system
            );

        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML();
        this.applyPermission(html);

        if (this.type === 'dualityRoll') {
            html.classList.add('duality');
            switch (this.system.roll.result.duality) {
                case 1:
                    html.classList.add('hope');
                    break;
                case -1:
                    html.classList.add('fear');
                    break;
                default:
                    html.classList.add('critical');
                    break;
            }
        }

        return html;
    }

    applyPermission(html) {
        const elements = html.querySelectorAll('[data-perm-id]');
        elements.forEach(e => {
            const uuid = e.dataset.permId,
                document = fromUuidSync(uuid);
            e.setAttribute('data-view-perm', document.testUserPermission(game.user, 'OBSERVER'));
            e.setAttribute('data-use-perm', document.testUserPermission(game.user, 'OWNER'));
        });
    }

    async _preCreate(data, options, user) {
        options.speaker = ChatMessage.getSpeaker();
        const rollActorOwner = data.rolls?.[0]?.data?.parent?.owner;
        if (rollActorOwner) {
            data.author = rollActorOwner ? rollActorOwner.id : data.author;
            await this.updateSource({ author: rollActorOwner ?? user });
        }

        return super._preCreate(data, options, rollActorOwner ?? user);
    }
}
