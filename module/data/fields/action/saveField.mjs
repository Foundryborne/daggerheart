const fields = foundry.data.fields;

export default class SaveField extends fields.SchemaField {
    order = 50;

    constructor(options = {}, context = {}) {
        const saveFields = {
            trait: new fields.StringField({
                nullable: true,
                initial: null,
                choices: CONFIG.DH.ACTOR.abilities
            }),
            difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
            damageMod: new fields.StringField({
                initial: CONFIG.DH.ACTIONS.damageOnSave.none.id,
                choices: CONFIG.DH.ACTIONS.damageOnSave
            })
        };
        super(saveFields, options, context);
    }

    async execute(config) {
        if(!this.hasRoll) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        }
        if(true) {
            
        }

    }

    async rollSave(actor, event, message) {
        if (!actor) return;
        const title = actor.isNPC
            ? game.i18n.localize('DAGGERHEART.GENERAL.reactionRoll')
            : game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                    ability: game.i18n.localize(abilities[this.save.trait]?.label)
                });
        return actor.diceRoll({
            event,
            title,
            roll: {
                trait: this.save.trait,
                difficulty: this.save.difficulty ?? this.actor?.baseSaveDifficulty,
                type: 'reaction'
            },
            type: 'trait',
            hasRoll: true,
            data: actor.getRollData()
        });
    }

    static rollSaveQuery({ actionId, actorId, event, message }) {
        return new Promise(async (resolve, reject) => {
            const actor = await fromUuid(actorId),
                action = await fromUuid(actionId);
            if (!actor || !actor?.isOwner) reject();
            action.rollSave(actor, event, message).then(result => resolve(result));
        });
    }
}
