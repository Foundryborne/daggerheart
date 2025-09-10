import { emitAsGM, GMUpdateEvent } from '../../../systemRegistration/socket.mjs';

const fields = foundry.data.fields;

export default class EffectsField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 100;

    /** @inheritDoc */
    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            _id: new fields.DocumentIdField(),
            onSave: new fields.BooleanField({ initial: false })
        });
        super(element, options, context);
    }

    /**
     * Apply Effects Action Workflow part.
     * Must be called within Action context or similar.
     * @param {object} config                    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {object[]} [targets=null]     Array of targets to override pre-selected ones.
     * @param {boolean} [force=false]       If the method should be executed outside of Action workflow, for ChatMessage button for example.
     */
    static async execute(config, targets = null, force = false) {
        if (!config.hasEffect) return;
        let message = config.message ?? ui.chat.collection.get(config.parent?._id);
        if (!message) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            message = config.message = await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        }
        if (EffectsField.getAutomation() || force) {
            targets ??= (message.system?.targets ?? config.targets).filter(t => !config.hasRoll || t.hit);
            await emitAsGM(GMUpdateEvent.UpdateEffect, EffectsField.applyEffects.bind(this), targets, this.uuid);
            // EffectsField.applyEffects.call(this, config.targets.filter(t => !config.hasRoll || t.hit));
        }
    }

    /**
     * Apply Action Effects to a list of Targets
     * Must be called within Action context or similar.
     * @param {object[]} targets Array of formatted targets
     */
    static async applyEffects(targets) {
        if (!this.effects?.length || !targets?.length) return;
        let effects = this.effects;
        targets.forEach(async token => {
            if (this.hasSave && token.saved.success === true) effects = this.effects.filter(e => e.onSave === true);
            if (!effects.length) return;
            effects.forEach(async e => {
                const actor = canvas.tokens.get(token.id)?.actor,
                    effect = this.item.effects.get(e._id);
                if (!actor || !effect) return;
                await EffectsField.applyEffect(effect, actor);
            });
        });
    }

    /**
     * Apply an Effect to a target or enable it if already on it
     * @param {object} effect   Effect object containing ActiveEffect UUID
     * @param {object} actor    Actor Document
     */
    static async applyEffect(effect, actor) {
        const existingEffect = actor.effects.find(e => e.origin === effect.uuid);
        if (existingEffect) {
            return effect.update(
                foundry.utils.mergeObject({
                    ...effect.constructor.getInitialDuration(),
                    disabled: false
                })
            );
        }

        // Otherwise, create a new effect on the target
        const effectData = foundry.utils.mergeObject({
            ...effect.toObject(),
            disabled: false,
            transfer: false,
            origin: effect.uuid
        });
        await ActiveEffect.implementation.create(effectData, { parent: actor });
    }

    /**
     * Return the automation setting for execute method for current user role
     * @returns {boolean} If execute should be triggered automatically
     */
    static getAutomation() {
        return (
            (game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.effect.gm) ||
            (!game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.effect.players)
        );
    }
}
