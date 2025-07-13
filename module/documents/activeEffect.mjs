export default class DhActiveEffect extends ActiveEffect {
    get isSuppressed() {
        // If this is a copied effect from an attachment, never suppress it
        // (These effects have attachmentSource metadata)
        if (this.flags?.daggerheart?.attachmentSource) {
            return false;
        }

        // Then apply the standard suppression rules
        if (['weapon', 'armor'].includes(this.parent?.type)) {
            return !this.parent.system.equipped;
        }

        if (this.parent?.type === 'domainCard') {
            return this.parent.system.inVault;
        }

        return super.isSuppressed;
    }

    /**
     * Check if the parent item is currently attached to another item
     * @returns {boolean}
     */
    get isAttached() {
        if (!this.parent || !this.parent.parent) return false;
        
        // Check if this item's UUID is in any actor's armor or weapon attachment lists
        const actor = this.parent.parent;
        if (!actor || !actor.items) return false;
        
        return actor.items.some(item => {
            return (item.type === 'armor' || item.type === 'weapon') && 
                   item.system?.attached && 
                   Array.isArray(item.system.attached) &&
                   item.system.attached.includes(this.parent.uuid);
        });
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
        const isItemTarget = change.value.toLowerCase().startsWith('item.');
        change.value = isItemTarget ? change.value.slice(5) : change.value;
        change.value = Roll.safeEval(
            Roll.replaceFormulaData(change.value, isItemTarget ? change.effect.parent : model)
        );
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
