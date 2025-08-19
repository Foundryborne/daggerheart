const fields = foundry.data.fields;

export default class EffectsField extends fields.ArrayField {
    order = 100;

    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            _id: new fields.DocumentIdField(),
            onSave: new fields.BooleanField({ initial: false })
        });
        super(element, options, context);
    }

    async execute(config) {
        if(!this.hasEffect) return;
        if(!config.message) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            config.message = await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        }
        if(EffectsField.getAutomation()) {
            EffectsField.applyEffects.call(this, config.targets);
        }
    }

    static async applyEffects(targets) {
        const force = true; /* Where should this come from? */
        if (!this.effects?.length || !targets?.length) return;
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
                await EffectsField.applyEffect(effect, actor);
            });
        });
    }

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

    static getAutomation() {
        return (game.user.isGM && game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.effect.gm) || (!game.user.isGM && game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.effect.players)
    }
}
