import DamageSelectionDialog from '../applications/damageSelectionDialog.mjs';
import NpcRollSelectionDialog from '../applications/npcRollSelectionDialog.mjs';
import RollSelectionDialog from '../applications/rollSelectionDialog.mjs';
import { GMUpdateEvent, socketEvent } from '../helpers/socket.mjs';
import { setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';

export default class DhpActor extends Actor {
    async _preCreate(data, options, user) {
        if ((await super._preCreate(data, options, user)) === false) return false;

        // Configure prototype token settings
        const prototypeToken = {};
        if (this.type === 'pc')
            Object.assign(prototypeToken, {
                sight: { enabled: true },
                actorLink: true,
                disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
            });
        this.updateSource({ prototypeToken });
    }

    prepareData() {
        super.prepareData();
    }

    async _preUpdate(changed, options, user) {
        super._preUpdate(changed, options, user);
    }

    async updateLevel(newLevel) {
        if (this.type !== 'pc' || newLevel === this.system.levelData.level.changed) return;

        if (newLevel > this.system.levelData.level.current) {
            await this.update({ 'system.levelData.level.changed': newLevel });
        } else {
            const updatedLevelups = Object.keys(this.system.levelData.levelups).reduce((acc, level) => {
                if (Number(level) > newLevel) acc[`-=${level}`] = null;

                return acc;
            }, {});

            const domainCards = Object.keys(this.system.levelData.levelups)
                .filter(x => x > newLevel)
                .flatMap(levelKey => {
                    const level = this.system.levelData.levelups[levelKey];
                    const achievementCards = level.achievements.domainCards.map(x => x.itemUuid);
                    const advancementCards = level.selections.filter(x => x.type === 'domainCard').map(x => x.itemUuid);
                    return [...achievementCards, ...advancementCards];
                });

            for (var domainCard of domainCards) {
                const itemCard = await this.items.find(x => x.uuid === domainCard);
                itemCard.delete();
            }

            await this.update({
                system: {
                    levelData: {
                        level: {
                            current: newLevel,
                            changed: newLevel
                        },
                        levelups: updatedLevelups
                    }
                }
            });
        }
    }

    async levelUp(levelupData) {
        const levelups = {};
        for (var levelKey of Object.keys(levelupData)) {
            const level = levelupData[levelKey];
            const achievementDomainCards = [];
            for (var card of Object.values(level.achievements.domainCards)) {
                const item = await foundry.utils.fromUuid(card.uuid);
                const embeddedItem = await this.createEmbeddedDocuments('Item', [item.toObject()]);
                card.itemUuid = embeddedItem[0].uuid;
                achievementDomainCards.push(card);
            }

            const selections = [];
            for (var optionKey of Object.keys(level.choices)) {
                const selection = level.choices[optionKey];
                for (var checkboxNr of Object.keys(selection)) {
                    const checkbox = selection[checkboxNr];
                    let itemUuid = null;

                    if (checkbox.type === 'domainCard') {
                        const item = await foundry.utils.fromUuid(checkbox.data[0]);
                        const embeddedItem = await this.createEmbeddedDocuments('Item', [item.toObject()]);
                        itemUuid = embeddedItem[0].uuid;
                    }

                    selections.push({
                        ...checkbox,
                        level: Number(levelKey),
                        optionKey: optionKey,
                        checkboxNr: Number(checkboxNr),
                        itemUuid
                    });
                }
            }

            levelups[levelKey] = {
                achievements: {
                    ...level.achievements,
                    domainCards: achievementDomainCards
                },
                selections: selections
            };
        }

        await this.update({
            system: {
                levelData: {
                    level: {
                        current: this.system.levelData.level.changed
                    },
                    levelups: levelups
                }
            }
        });
    }

    async diceRoll(modifier, shiftKey) {
        if (this.type === 'pc') {
            return await this.dualityRoll(modifier, shiftKey);
        } else {
            return await this.npcRoll(modifier, shiftKey);
        }
    }

    async npcRoll(modifier, shiftKey) {
        let advantage = null;

        const modifiers = [
            {
                value: Number.parseInt(modifier.value),
                label: modifier.value >= 0 ? `+${modifier.value}` : `-${modifier.value}`,
                title: modifier.title
            }
        ];
        if (!shiftKey) {
            const dialogClosed = new Promise((resolve, _) => {
                new NpcRollSelectionDialog(this.system.experiences, resolve).render(true);
            });
            const result = await dialogClosed;

            advantage = result.advantage;
            result.experiences.forEach(x =>
                modifiers.push({
                    value: x.value,
                    label: x.value >= 0 ? `+${x.value}` : `-${x.value}`,
                    title: x.description
                })
            );
        }

        const roll = Roll.create(
            `${advantage === true || advantage === false ? 2 : 1}d20${advantage === true ? 'kh' : advantage === false ? 'kl' : ''} ${modifiers.map(x => `+ ${x.value}`).join(' ')}`
        );
        let rollResult = await roll.evaluate();
        const dice = [];
        for (var i = 0; i < rollResult.terms.length; i++) {
            const term = rollResult.terms[i];
            if (term.faces) {
                dice.push({ type: `d${term.faces}`, rolls: term.results.map(x => ({ value: x.result })) });
            }
        }

        // There is Only ever one dice term here
        return { roll, dice: dice[0], modifiers, advantageState: advantage === true ? 1 : advantage === false ? 2 : 0 };
    }

    async dualityRoll(modifier, shiftKey, bonusDamage = []) {
        let hopeDice = 'd12',
            fearDice = 'd12',
            advantageDice = null,
            disadvantageDice = null,
            bonusDamageString = '';

        const modifiers =
            modifier.value !== null
                ? [
                      {
                          value: modifier.value ? Number.parseInt(modifier.value) : 0,
                          label:
                              modifier.value >= 0
                                  ? `${modifier.title} +${modifier.value}`
                                  : `${modifier.title} ${modifier.value}`,
                          title: modifier.title
                      }
                  ]
                : [];
        if (!shiftKey) {
            const dialogClosed = new Promise((resolve, _) => {
                new RollSelectionDialog(
                    this.system.experiences,
                    bonusDamage,
                    this.system.resources.hope.value,
                    resolve
                ).render(true);
            });
            const result = await dialogClosed;
            (hopeDice = result.hope),
                (fearDice = result.fear),
                (advantageDice = result.advantage),
                (disadvantageDice = result.disadvantage);
            result.experiences.forEach(x =>
                modifiers.push({
                    value: x.value,
                    label: x.value >= 0 ? `+${x.value}` : `-${x.value}`,
                    title: x.description
                })
            );
            bonusDamageString = result.bonusDamage;

            const automateHope = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.Hope);

            if (automateHope && result.hopeUsed) {
                await this.update({
                    'system.resources.hope.value': this.system.resources.hope.value - result.hopeUsed
                });
            }
        }
        const roll = new Roll(
            `1${hopeDice} + 1${fearDice}${advantageDice ? ` + 1${advantageDice}` : disadvantageDice ? ` - 1${disadvantageDice}` : ''} ${modifiers.map(x => `+ ${x.value}`).join(' ')}`
        );
        let rollResult = await roll.evaluate();
        setDiceSoNiceForDualityRoll(rollResult, advantageDice, disadvantageDice);

        const hope = rollResult.dice[0].results[0].result;
        const fear = rollResult.dice[1].results[0].result;
        const advantage = advantageDice ? rollResult.dice[2].results[0].result : null;
        const disadvantage = disadvantageDice ? rollResult.dice[2].results[0].result : null;

        if (disadvantage) {
            rollResult = { ...rollResult, total: rollResult.total - Math.max(hope, disadvantage) };
        }
        if (advantage) {
            rollResult = { ...rollResult, total: 'Select Hope Die' };
        }

        const automateHope = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.Hope);
        if (automateHope && hope > fear) {
            await this.update({
                'system.resources.hope.value': Math.min(
                    this.system.resources.hope.value + 1,
                    this.system.resources.hope.max
                )
            });
        }

        if (automateHope && hope === fear) {
            await this.update({
                'system.resources': {
                    'hope.value': Math.min(this.system.resources.hope.value + 1, this.system.resources.hope.max),
                    'stress.value': Math.max(this.system.resources.stress.value - 1, 0)
                }
            });
        }

        return {
            roll,
            rollResult,
            hope: { dice: hopeDice, value: hope },
            fear: { dice: fearDice, value: fear },
            advantage: { dice: advantageDice, value: advantage },
            disadvantage: { dice: disadvantageDice, value: disadvantage },
            modifiers: modifiers,
            bonusDamageString
        };
    }

    async damageRoll(title, damage, targets, shiftKey) {
        let rollString = damage.value;
        let bonusDamage = damage.bonusDamage?.filter(x => x.initiallySelected) ?? [];
        if (!shiftKey) {
            const dialogClosed = new Promise((resolve, _) => {
                new DamageSelectionDialog(rollString, bonusDamage, resolve).render(true);
            });
            const result = await dialogClosed;
            bonusDamage = result.bonusDamage;
            rollString = result.rollString;

            const automateHope = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.Hope);
            if (automateHope && result.hopeUsed) {
                await this.update({
                    'system.resources.hope.value': this.system.resources.hope.value - result.hopeUsed
                });
            }
        }

        const roll = new Roll(rollString);
        let rollResult = await roll.evaluate();

        const dice = [];
        const modifiers = [];
        for (var i = 0; i < rollResult.terms.length; i++) {
            const term = rollResult.terms[i];
            if (term.faces) {
                dice.push({ type: `d${term.faces}`, rolls: term.results.map(x => x.result) });
            } else if (term.operator) {
            } else if (term.number) {
                const operator = i === 0 ? '' : rollResult.terms[i - 1].operator;
                modifiers.push({ value: term.number, operator: operator });
            }
        }

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: game.i18n.format('DAGGERHEART.Chat.DamageRoll.Title', { damage: title }),
            roll: rollString,
            damage: {
                total: rollResult.total,
                type: damage.type
            },
            dice: dice,
            modifiers: modifiers,
            targets: targets
        };
        const msg = new cls({
            type: 'damageRoll',
            user: game.user.id,
            sound: CONFIG.sounds.dice,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/damage-roll.hbs',
                systemData
            ),
            rolls: [roll]
        });

        cls.create(msg.toObject());
    }

    async takeDamage(damage, type) {
        const hpDamage =
            damage >= this.system.damageThresholds.severe
                ? 3
                : damage >= this.system.damageThresholds.major
                  ? 2
                  : damage >= this.system.damageThresholds.minor
                    ? 1
                    : 0;

        const update = {
            'system.resources.hitPoints.value': Math.min(
                this.system.resources.hitPoints.value + hpDamage,
                this.system.resources.hitPoints.max
            )
        };

        if (game.user.isGM) {
            await this.update(update);
        } else {
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateDocument,
                    uuid: this.uuid,
                    update: update
                }
            });
        }
    }

    async takeHealing(healing, type) {
        let update = {};
        switch (type) {
            case SYSTEM.GENERAL.healingTypes.health.id:
                update = {
                    'system.resources.hitPoints.value': Math.min(
                        this.system.resources.hitPoints.value + healing,
                        this.system.resources.hitPoints.max
                    )
                };
                break;
            case SYSTEM.GENERAL.healingTypes.stress.id:
                update = {
                    'system.resources.stress.value': Math.min(
                        this.system.resources.stress.value + healing,
                        this.system.resources.stress.max
                    )
                };
                break;
        }

        if (game.user.isGM) {
            await this.update(update);
        } else {
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateDocument,
                    uuid: this.uuid,
                    update: update
                }
            });
        }
    }

    async emulateItemDrop(data) {
        const event = new DragEvent('drop', { altKey: game.keyboard.isModifierActive('Alt') });
        return this.sheet._onDropItem(event, { data: data });
    }

    //Move to action-scope?
    async useAction(action) {
        const userTargets = Array.from(game.user.targets);
        const otherTarget = action.target.type === SYSTEM.ACTIONS.targetTypes.other.id;
        if (otherTarget && userTargets.length === 0) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.ActionRequiresTarget'));
            return;
        }

        if (action.cost.type != null && action.cost.value != null) {
            if (
                this.system.resources[action.cost.type].value - action.cost.value <=
                this.system.resources[action.cost.type].min
            ) {
                ui.notifications.error(game.i18n.localize(`Insufficient ${action.cost.type} to use this ability`));
                return;
            }
        }

        // const targets = otherTarget ? userTargets : [game.user.character];
        if (action.damage.type) {
            let roll = { formula: action.damage.value, result: action.damage.value };
            if (Number.isNaN(Number.parseInt(action.damage.value))) {
                roll = await new Roll(`1${action.damage.value}`).evaluate();
            }

            const cls = getDocumentClass('ChatMessage');
            const msg = new cls({
                user: game.user.id,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/chat/damage-roll.hbs',
                    {
                        roll: roll.formula,
                        total: roll.result,
                        type: action.damage.type
                    }
                )
            });

            cls.create(msg.toObject());
        }

        if (action.healing.type) {
            let roll = { formula: action.healing.value, result: action.healing.value };
            if (Number.isNaN(Number.parseInt(action.healing.value))) {
                roll = await new Roll(`1${action.healing.value}`).evaluate();
            }

            const cls = getDocumentClass('ChatMessage');
            const msg = new cls({
                user: game.user.id,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/chat/healing-roll.hbs',
                    {
                        roll: roll.formula,
                        total: roll.result,
                        type: action.healing.type
                    }
                )
            });

            cls.create(msg.toObject());
        }
    }
}
