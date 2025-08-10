import { itemAbleRollParse } from '../helpers/utils.mjs';

export default class DhActiveEffect extends foundry.documents.ActiveEffect {
    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /**@override */
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

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    /**@inheritdoc*/
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

    /* -------------------------------------------- */
    /*  Methods                                     */
    /* -------------------------------------------- */

    /**@inheritdoc*/
    static applyField(model, change, field) {
        const isOriginTarget = change.value.toLowerCase().includes('origin.@');
        let parseModel = model;
        if (isOriginTarget && change.effect.origin) {
            change.value = change.value.replaceAll(/origin\.@/gi, '@');
            try {
                const effect = foundry.utils.fromUuidSync(change.effect.origin);
                const doc = effect.parent?.parent;
                if (doc) parseModel = doc;
            } catch (_) {}
        }

        const evalValue = this.effectSafeEval(itemAbleRollParse(change.value, parseModel, change.effect.parent));
        change.value = evalValue ?? change.value;
        super.applyField(model, change, field);
    }

    /**
     * Altered Foundry safeEval to allow non-numeric return
     * @param {string} expression
     * @returns
     */
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

    /**
     * Generates a list of localized tags based on this item's type-specific properties.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [
            `${game.i18n.localize(this.parent.system.metadata.label)}: ${this.parent.name}`,
            game.i18n.localize(
                this.isTemporary ? 'DAGGERHEART.EFFECTS.Duration.temporary' : 'DAGGERHEART.EFFECTS.Duration.passive'
            )
        ];

        for (const statusId of this.statuses) {
            const status = CONFIG.statusEffects.find(s => s.id === statusId);
            tags.push(game.i18n.localize(status.name));
        }

        return tags;
    }

    /**
     * Create a new ChatMessage to display this document’s data.
     * @param {String} origin -  uuid of a document. TODO: This needs to be reviewed.
     */
    async toChat(origin) {
        /**@type {foundry.documents.ChatMessage} */
        const cls = getDocumentClass('ChatMessage');
        const speaker = cls.getSpeaker();
        const actor = cls.getSpeakerActor(speaker);
        const systemData = {
            action: { img: this.img, name: this.name },
            actor: { name: actor?.name, img: actor?.img },
            speaker,
            origin,
            description: this.description,
            actions: []
        };
        const msg = {
            title: game.i18n.localize('DAGGERHEART.GENERAL.Effect.single'),
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/action.hbs',
                systemData
            )
        };

        cls.create(msg);
    }

    prepareDerivedData() {
        /* Preventing subclass features from transferring to actor if they do not have the right subclass advancement */
        if (this.parent?.type === 'feature') {
            const origSubclassParent = this.parent.system.originItemType === 'subclass';
            if (origSubclassParent) {
                const subclass = this.parent.parent.items.find(
                    x =>
                        x.type === 'subclass' &&
                        x.system.isMulticlass === (this.parent.system.identifier === 'multiclass')
                );

                if (subclass) {
                    const featureState = subclass.system.featureState;
                    const featureType = subclass
                        ? (subclass.system.features.find(x => x.item?.uuid === this.parent.uuid)?.type ?? null)
                        : null;

                    if (
                        (featureType === CONFIG.DH.ITEM.featureSubTypes.specialization && featureState < 2) ||
                        (featureType === CONFIG.DH.ITEM.featureSubTypes.mastery && featureState < 3)
                    ) {
                        this.transfer = false;
                    }
                }
            }
        }
    }
}
