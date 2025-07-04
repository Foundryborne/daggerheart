import DHBaseAction from './baseAction.mjs';

export default class DHEffectAction extends DHBaseAction {
    static extraSchemas = ['effects', 'target'];

    async use(event, ...args) {
        const config = await super.use(event, args);
        if (['error', 'warning'].includes(config.type)) return;
        return await this.chatApplyEffects(event, config);
    }

    async chatApplyEffects(event, data) {
        const cls = getDocumentClass('ChatMessage'),
            systemData = {
                title: game.i18n.format('DAGGERHEART.Chat.ApplyEffect.Title', { name: this.name }),
                origin: this.actor._id,
                description: '',
                targets: data.targets.map(x => ({ id: x.id, name: x.name, img: x.img, hit: true })),
                action: {
                    itemId: this.item._id,
                    actionId: this._id
                }
            },
            msg = new cls({
                type: 'applyEffect',
                user: game.user.id,
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/ui/chat/apply-effects.hbs',
                    systemData
                )
            });

        cls.create(msg.toObject());
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/ui/chat/apply-effects.hbs';
    }
}
