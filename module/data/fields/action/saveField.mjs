import { abilities } from '../../../config/actorConfig.mjs';

const fields = foundry.data.fields;

export default class SaveField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 50;

    /** @inheritDoc */
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
                choices: CONFIG.DH.ACTIONS.damageOnSave,
                nullable: false,
                required: true
            })
        };
        super(saveFields, options, context);
    }

    /**
     * Reaction Roll Action Workflow part.
     * Must be called within Action context or similar.
     * @param {object} config                    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {object[]} [targets=null]     Array of targets to override pre-selected ones.
     * @param {boolean} [force=false]       If the method should be executed outside of Action workflow, for ChatMessage button for example.
     */
    static async execute(config, targets = null, force = false) {
        if (!config.hasSave) return;
        let message = config.message ?? ui.chat.collection.get(config.parent?._id);

        if (!message) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            message = config.message = await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        }
        if (SaveField.getAutomation() !== CONFIG.DH.SETTINGS.actionAutomationChoices.never.id || force) {
            targets ??= config.targets.filter(t => !config.hasRoll || t.hit);
            await SaveField.rollAllSave.call(this, targets, config.event, message);
        } else return false;
    }

    /**
     * Roll a Reaction Roll for all targets. Send a query to the owner if the User is not.
     * Must be called within Action context.
     * @param {object[]} targets        Array of formatted targets.
     * @param {Event} event             Triggering event
     * @param {ChatMessage} message     The ChatMessage the triggered button comes from.
     */
    static async rollAllSave(targets, event, message) {
        if (!targets) return;
        return new Promise(resolve => {
            const aPromise = [];
            targets.forEach(target => {
                aPromise.push(
                    new Promise(async subResolve => {
                        const actor = fromUuidSync(target.actorId);
                        if (actor) {
                            const rollSave =
                                game.user === actor.owner
                                    ? SaveField.rollSave.call(this, actor, event)
                                    : actor.owner.query('reactionRoll', {
                                          actionId: this.uuid,
                                          actorId: actor.uuid,
                                          event,
                                          message
                                      });
                            const result = await rollSave;
                            await SaveField.updateSaveMessage.call(this, result, message, target.id);
                            subResolve();
                        } else subResolve();
                    })
                );
            });
            Promise.all(aPromise).then(result => resolve());
        });
    }

    /**
     * Roll a Reaction Roll for the specified Actor against the Action difficulty.
     * Must be called within Action context.
     * @param {*} actor         Actor document
     * @param {Event} event     Triggering event
     * @returns {object}        Actor diceRoll config result.
     */
    static async rollSave(actor, event) {
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
                    type: 'trait'
                },
                actionType: 'reaction',
                hasRoll: true,
                data: actor.getRollData()
            };
        if (SaveField.getAutomation() === CONFIG.DH.SETTINGS.actionAutomationChoices.always.id)
            rollConfig.dialog = { configure: false };
        return actor.diceRoll(rollConfig);
    }

    /**
     * Update a Roll ChatMessage for a token according to his Reaction Roll result.
     * @param {object} result        Result from the Reaction Roll
     * @param {object} message       ChatMessage to update
     * @param {string} targetId      Token ID
     */
    static async updateSaveMessage(result, message, targetId) {
        if (!result) return;
        const updateMsg = async function (message, targetId, result) {
            // setTimeout(async () => {
            const chatMessage = ui.chat.collection.get(message._id),
                changes = {
                    flags: {
                        [game.system.id]: {
                            reactionRolls: {
                                [targetId]: {
                                    result: result.roll.total,
                                    success: result.roll.success
                                }
                            }
                        }
                    }
                };
            await chatMessage.update(changes);
            // }, 100);
        };
        if (game.modules.get('dice-so-nice')?.active)
            game.dice3d
                .waitFor3DAnimationByMessageID(result.message.id ?? result.message._id)
                .then(async () => await updateMsg(message, targetId, result));
        else await updateMsg(message, targetId, result);
    }

    /**
     * Return the automation setting for execute method for current user role
     * @returns {string} Id from settingsConfig.mjs actionAutomationChoices
     */
    static getAutomation() {
        return (
            (game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.save.gm) ||
            (!game.user.isGM &&
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).roll.save.players)
        );
    }

    /**
     * Send a query to an Actor owner to roll a Reaction Roll then send back the result.
     * @param {object} param0
     * @param {string} param0.actionId         Action ID
     * @param {string} param0.actorId          Actor ID
     * @param {Event} param0.event             Triggering event
     * @param {ChatMessage} param0.message     Chat Message to update
     * @returns
     */
    static rollSaveQuery({ actionId, actorId, event, message }) {
        return new Promise(async (resolve, reject) => {
            const actor = await fromUuid(actorId),
                action = await fromUuid(actionId);
            if (!actor || !actor?.isOwner) reject();
            SaveField.rollSave.call(action, actor, event, message).then(result => resolve(result));
        });
    }
}
