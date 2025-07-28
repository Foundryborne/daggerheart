import { itemAbleRollParse } from '../helpers/utils.mjs';

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
            return (
                (item.type === 'armor' || item.type === 'weapon') &&
                item.system?.attached &&
                Array.isArray(item.system.attached) &&
                item.system.attached.includes(this.parent.uuid)
            );
        });
    }

    get localizedStatuses() {
        const { statusMap, isStatusActiveEffect } = this.isStatusActiveEffect;
        if (!isStatusActiveEffect) return [];

        return this.statuses.map(x => ({
            key: x,
            name: game.i18n.localize(statusMap.get(x).name)
        }));
    }

    get isStatusActiveEffect() {
        const statusMap = new Map(foundry.CONFIG.statusEffects.map(status => [status.id, status]));
        const isStatusActiveEffect =
            this.statuses.size === 1 && this.name === game.i18n.localize(statusMap.get(this.statuses.first()).name);
        return { statusMap, isStatusActiveEffect };
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

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        if (game.user.id === userId) {
            this.addStatusActiveEffects(data.statuses);
        }
    }

    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        if ('disabled' in changed) {
            if (changed.disabled) {
                this.removeStatusActiveEffects(this.statuses);
            } else {
                this.addStatusActiveEffects(this.statuses);
            }
        }
    }

    _onDelete(data, userId) {
        super._onDelete(data, userId);

        if (game.user.id === userId) {
            this.removeStatusActiveEffects(this.statuses);
        }
    }

    static applyField(model, change, field) {
        const evalValue = this.effectSafeEval(itemAbleRollParse(change.value, model, change.effect.parent));
        change.value = evalValue ?? change.value;
        super.applyField(model, change, field);
    }

    /* Altered Foundry safeEval to allow non-numeric returns */
    static effectSafeEval(expression) {
        let result;
        try {
            // eslint-disable-next-line no-new-func
            const evl = new Function('sandbox', `with (sandbox) { return ${expression}}`);
            result = evl(Roll.MATH_PROXY);
        } catch (err) {
            return expression;
        }

        return result;
    }

    async addStatusActiveEffects(statuses) {
        if (this.parent.type !== 'character') return;

        const { statusMap, isStatusActiveEffect } = this.isStatusActiveEffect;
        if (isStatusActiveEffect) return;

        const statusesToAdd = statuses.reduce((acc, status) => {
            const statusData = statusMap.get(status);
            const statusName = game.i18n.localize(statusData.name);
            const alreadyExists = this.parent.effects.find(
                effect => effect.statuses.size === 1 && effect.statuses.first() === status && effect.name === statusName
            );
            if (!alreadyExists) {
                acc.push({
                    name: statusName,
                    description: game.i18n.localize(statusData.description),
                    img: statusData.icon,
                    statuses: [status]
                });
            }

            return acc;
        }, []);

        await this.parent.createEmbeddedDocuments('ActiveEffect', statusesToAdd);
    }

    async removeStatusActiveEffects(statuses) {
        if (this.parent.type !== 'character') return;

        const { statusMap, isStatusActiveEffect } = this.isStatusActiveEffect;
        if (isStatusActiveEffect) return;

        const statusesToRemove = statuses.reduce((acc, status) => {
            const statusName = game.i18n.localize(statusMap.get(status).name);
            const existingEffect = this.parent.effects.find(
                effect => effect.statuses.size === 1 && effect.statuses.first() === status && effect.name === statusName
            );
            if (existingEffect) {
                acc.push(existingEffect.id);
            }

            return acc;
        }, []);

        await this.parent.deleteEmbeddedDocuments('ActiveEffect', statusesToRemove);
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
