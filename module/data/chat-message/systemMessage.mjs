import DhBaseChatMessage from './base';

export default class DHSystemMessage extends DhBaseChatMessage {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            useTitle: new fields.BooleanField({ initial: true })
        };
    }

    addChatListeners(html) {
        super.addChatListeners(html);

        for (const element of html.querySelectorAll('.undo-damage-button')) {
            element.addEventListener('click', this.onUndoDamage.bind(this))
        }
    }

    /* -------------------------------------------- */
    /*  Event Listeners                             */
    /* -------------------------------------------- */

    async onUndoDamage(event) {
        event.preventDefault();
        event.stopPropagation();
        const { token: tokenId } = event.target.closest('[data-token]').dataset;
        const actor = canvas.scene.tokens.get(tokenId)?.actor;
        const resourcesUpdates = this.parent.getFlag(CONFIG.DH.id, 'resourcesUpdates') ?? [];
        const [index, actorDatas] = [...resourcesUpdates.entries()]?.find(([index, r]) => r.token?.id === tokenId)
            ?? [];
        const actorUpdates = actorDatas?.updates;
        if (!actor || !actorUpdates) return;

        const revertedUpdates = actorUpdates.map(u => ({...u, value: u.value * -1}));
        const updated = await actor.modifyResource(revertedUpdates);
        if (updated) {
            resourcesUpdates[index].token.reverted = true;
            await this.parent.setFlag(CONFIG.DH.id, 'resourcesUpdates', resourcesUpdates);

            const element = document.createElement('div');
            element.innerHTML = this.parent.content;
            element.querySelector(`[data-token="${tokenId}"]`).classList.add('damage-reverted');
            await this.parent.update({ content: element.innerHTML });

            this.parent.renderHTML();
        }
    }
}
