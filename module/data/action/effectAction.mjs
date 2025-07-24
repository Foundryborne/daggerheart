import DHBaseAction from './baseAction.mjs';

export default class DHEffectAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'effects', 'target'];

    async trigger(event, data) {
        if (this.effects.length) {
            const cls = getDocumentClass('ChatMessage'),
                msg = {
                    type: 'applyEffect',
                    user: game.user.id,
                    system: data
                };

            return await cls.create(msg);
        } else this.toChat(this.id);
    }
}
