import { itemAbleRollParse } from '../helpers/utils.mjs';
import { RefreshType } from '../systemRegistration/socket.mjs';

export default class DhActiveEffect extends foundry.documents.ActiveEffect {
    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /**@override */
    get isSuppressed() {
        if (this.system.isSuppressed === true) return true;

        // If this is a copied effect from an attachment, never suppress it
        // (These effects have attachmentSource metadata)
        if (this.flags?.daggerheart?.attachmentSource) {
            return false;
        }

        // Then apply the standard suppression rules
        if (['weapon', 'armor'].includes(this.parent?.type) && this.transfer) {
            return !this.parent.system.equipped;
        }

        if (this.parent?.type === 'domainCard') {
            const isVaultSupressed = this.parent.system.isVaultSupressed;
            const domainTouchedSupressed = this.parent.system.isDomainTouchedSuppressed;

            return isVaultSupressed || domainTouchedSupressed;
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

    /**
     * Whether this Active Effect is eligible to be registered with the {@link ActiveEffectRegistry}
     */
    get isExpiryTrackable() {
        return (
            this.persisted &&
            !this.inCompendium &&
            this.modifiesActor &&
            this.start &&
            this.isTemporary &&
            !this.isExpired
        );
    }

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    /** @inheritdoc */
    static async createDialog(data = {}, createOptions = {}, options = {}) {
        const { folders, types, template, context = {}, ...dialogOptions } = options;

        if (types?.length === 0) {
            throw new Error('The array of sub-types to restrict to must not be empty.');
        }

        const creatableEffects = types || ['base'];
        const documentTypes = this.TYPES.filter(type => creatableEffects.includes(type)).map(type => {
            const labelKey = `TYPES.ActiveEffect.${type}`;
            const label = game.i18n.has(labelKey) ? game.i18n.localize(labelKey) : type;

            return { value: type, label };
        });

        if (!documentTypes.length) {
            throw new Error('No document types were permitted to be created.');
        }

        const sortedTypes = documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

        return await super.createDialog(data, createOptions, {
            folders,
            types,
            template,
            context: { types: sortedTypes, ...context },
            ...dialogOptions
        });
    }

    /**@inheritdoc*/
    async _preCreate(data, options, user) {
        const update = {};
        if (!data.img) {
            update.img = 'icons/magic/life/heart-cross-blue.webp';
        }

        const statuses = Object.keys(data.statuses ?? {});
        const immuneStatuses =
            statuses.filter(
                status =>
                    this.parent.system.rules?.conditionImmunities &&
                    this.parent.system.rules.conditionImmunities[status]
            ) ?? [];
        if (immuneStatuses.length > 0) {
            update.statuses = statuses.filter(x => !immuneStatuses.includes(x));
            const conditions = CONFIG.DH.GENERAL.conditions();
            const scrollingTexts = immuneStatuses.map(status => ({
                text: game.i18n.format('DAGGERHEART.ACTIVEEFFECT.immuneStatusText', {
                    status: game.i18n.localize(conditions[status].name)
                })
            }));
            if (update.statuses.length > 0) {
                setTimeout(() => scrollingTexts, 500);
            } else {
                this.parent.queueScrollText(scrollingTexts);
            }
        }

        if (Object.keys(update).length > 0) {
            await this.updateSource(update);
        }

        await super._preCreate(data, options, user);
    }

    /** @inheritdoc */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        Hooks.callAll(RefreshType.EffectsDisplay);
    }

    /** @inheritdoc */
    _onDelete(data, options, userId) {
        super._onDelete(data, options, userId);

        Hooks.callAll(RefreshType.EffectsDisplay);
    }

    /* -------------------------------------------- */
    /*  Methods                                     */
    /* -------------------------------------------- */

    /**@inheritdoc*/
    static applyChangeField(model, change, field) {
        change.value = Number.isNumeric(change.value)
            ? change.value
            : DhActiveEffect.getChangeValue(model, change, change.effect);
        super.applyChangeField(model, change, field);
    }

    static _applyChangeUnguided(actor, change, changes, options) {
        change.value = DhActiveEffect.getChangeValue(actor, change, change.effect);
        super._applyChangeUnguided(actor, change, changes, options);
    }

    static getChangeValue(model, change, effect) {
        let key = change.value.toString();
        const isOriginTarget = key.toLowerCase().includes('origin.@');
        let parseModel = model;
        if (isOriginTarget && effect.origin) {
            key = change.key.replaceAll(/origin\.@/gi, '@');
            try {
                const originEffect = foundry.utils.fromUuidSync(effect.origin);
                const doc =
                    originEffect.parent?.parent instanceof game.system.api.documents.DhpActor
                        ? originEffect.parent
                        : originEffect.parent.parent;
                if (doc) parseModel = doc;
            } catch (_) {}
        }

        const evalValue = this.effectSafeEval(itemAbleRollParse(key, parseModel, effect.parent));
        return evalValue ?? key;
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
            if (status) tags.push(game.i18n.localize(status.name));
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
        /* Check for item availability such as in the case of subclass advancement. */
        if (this.parent?.parent?.system?.isItemAvailable) {
            if (!this.parent.parent.system.isItemAvailable(this.parent)) {
                this.transfer = false;
            }
        }
    }
}
