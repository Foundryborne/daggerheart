export default class DhActiveEffect extends ActiveEffect {
    get isSuppressed() {
        if (['weapon', 'armor'].includes(this.parent.type)) {
            return !this.parent.system.equipped;
        }

        if (this.parent.type === 'domainCard') {
            return this.parent.system.inVault;
        }

        return super.isSuppressed;
    }

    async _preCreate(data, options, user) {
        const update = {};
        if (!data.img) {
            update.img = 'icons/magic/life/heart-cross-blue.webp';
        }

        if (Object.keys(update).length > 0) {
            await this.updateSource(update);
        }

        await super._preCreate(data, options, user);
    }

    static applyField(model, change, field) {
        change.value = Roll.safeEval(Roll.replaceFormulaData(change.value, change.effect.parent));
        super.applyField(model, change, field);
    }

    async toChat(origin) {
        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.localize('DAGGERHEART.CONFIG.ActionType.action'),
            origin: origin,
            img: this.img,
            name: this.name,
            description: this.description,
            actions: []
        };
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            )
        });

        cls.create(msg.toObject());
    }
}
