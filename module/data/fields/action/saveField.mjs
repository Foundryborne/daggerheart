import { abilities } from "../../../config/actorConfig.mjs";
import { emitAsGM, GMUpdateEvent } from "../../../systemRegistration/socket.mjs";

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
        if(!this.hasSave) return;
        if(!config.message) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            config.message = await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        }
        if(SaveField.getAutomation() !== CONFIG.DH.SETTINGS.actionAutomationChoices.never.id) {
            SaveField.rollAllSave.call(this, config.targets, config.event, config.message);
        }

    }

    static async rollAllSave(targets, event, message) {
        if(!targets) return;
        targets.forEach(target => {
            const actor = fromUuidSync(target.actorId);
            if(actor) {
                if (game.user === actor.owner)
                    SaveField.rollSave.call(this, actor, event, message)
                        .then(result =>
                            emitAsGM(
                                GMUpdateEvent.UpdateSaveMessage,
                                SaveField.updateSaveMessage.bind(this, result, message, target.id),
                                {
                                    action: this.uuid,
                                    message: message._id,
                                    token: target.id,
                                    result
                                }
                            )
                        );
                else
                    actor.owner
                        .query('reactionRoll', {
                            actionId: this.uuid,
                            actorId: actor.uuid,
                            event,
                            message
                        })
                        .then(result => SaveField.updateSaveMessage.call(this, result, message, target.id));
            }
        });
    }

    static async rollSave(actor, event, message) {
        if (!actor) return;
        const title = actor.isNPC
            ? game.i18n.localize('DAGGERHEART.GENERAL.reactionRoll')
            : game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                    ability: game.i18n.localize(abilities[this.save.trait]?.label)
                }),
            rollConfig = {
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
            };
        if(SaveField.getAutomation() == CONFIG.DH.SETTINGS.actionAutomationChoices.always.id) rollConfig.dialog = { configure: false };
        return actor.diceRoll(rollConfig);
    }

    static updateSaveMessage(result, message, targetId) {
        if (!result) return;
        const updateMsg = this.updateChatMessage.bind(this, message, targetId, {
                flags: {
                    [game.system.id]: {
                        reactionRolls: {
                            [targetId]: 
                                {
                                    result: result.roll.total,
                                    success: result.roll.success
                                }
                        }
                    }
                }
            });
        if (game.modules.get('dice-so-nice')?.active)
            game.dice3d.waitFor3DAnimationByMessageID(result.message.id ?? result.message._id).then(() => updateMsg());
        else updateMsg();
    }

    static getAutomation() {
        return (game.user.isGM && game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.save.gm) || (!game.user.isGM && game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.save.players)
    }

    static rollSaveQuery({ actionId, actorId, event, message }) {
        return new Promise(async (resolve, reject) => {
            const actor = await fromUuid(actorId),
                action = await fromUuid(actionId);
            if (!actor || !actor?.isOwner) reject();
            SaveField.rollSave.call(action, actor, event, message)
                .then(result => resolve(result));
        });
    }
}
