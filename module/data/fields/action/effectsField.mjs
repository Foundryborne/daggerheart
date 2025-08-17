const fields = foundry.data.fields;

export default class EffectsField extends fields.ArrayField {
    static order = 60;

    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            _id: new fields.DocumentIdField(),
            onSave: new fields.BooleanField({ initial: false })
        });
        super(element, options, context);
    }

    static async execute(config) {
        if(!this.hasRoll) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        } else {
            return;
        }
    }

    async applyEffects(data, targets) {
        targets ??= data.system.targets;
        const force = true; /* Where should this come from? */
        if (!this.effects?.length || !targets.length) return;
        let effects = this.effects;
        targets.forEach(async token => {
            if (!token.hit && !force) return;
            if (this.hasSave && token.saved.success === true) {
                effects = this.effects.filter(e => e.onSave === true);
            }
            if (!effects.length) return;
            effects.forEach(async e => {
                const actor = canvas.tokens.get(token.id)?.actor,
                    effect = this.item.effects.get(e._id);
                if (!actor || !effect) return;
                await this.applyEffect(effect, actor);
            });
        });
    }

    async applyEffect(effect, actor) {
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
}
