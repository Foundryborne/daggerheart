import DamageSelectionDialog from '../applications/damageSelectionDialog.mjs';
import NpcRollSelectionDialog from '../applications/npcRollSelectionDialog.mjs';
import RollSelectionDialog from '../applications/rollSelectionDialog.mjs';
import { GMUpdateEvent, socketEvent } from '../helpers/socket.mjs';

export default class DhpActor extends Actor {
    _preCreate(data, changes, user) {
        if (data.type === 'pc') {
            data.prototypeToken = { actorLink: true, disposition: 1, sight: { enabled: true } };
        }

        super._preCreate(data, changes, user);
    }

    prepareData() {
        super.prepareData();
    }

    async _preUpdate(changed, options, user) {
        //Level Down
        if (
            changed.system?.levelData?.changedLevel &&
            this.system.levelData.currentLevel > changed.system.levelData.changedLevel
        ) {
            changed.system.levelData.currentLevel = changed.system.levelData.changedLevel;
            changed.system.levelData.levelups = Object.keys(this.system.levelData.levelups).reduce((acc, x) => {
                if (x > changed.system.levelData.currentLevel) {
                    acc[`-=${x}`] = null;
                }

                return acc;
            }, {});

            changed.system.attributes = Object.keys(this.system.attributes).reduce((acc, key) => {
                acc[key] = {
                    levelMarks: this.system.attributes[key].levelMarks.filter(
                        x => x <= changed.system.levelData.currentLevel
                    )
                };

                return acc;
            }, {});

            changed.system.experiences = this.system.experiences.filter(
                x => x.level <= changed.system.levelData.currentLevel
            );

            if (
                this.system.multiclass &&
                this.system.multiclass.system.multiclass > changed.system.levelData.changedLevel
            ) {
                const multiclassFeatures = this.items.filter(x => x.system.multiclass);
                for (var feature of multiclassFeatures) {
                    await feature.delete();
                }
            }
        }

        super._preUpdate(changed, options, user);
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

        const modifiers = [
            {
                value: modifier.value ? Number.parseInt(modifier.value) : 0,
                label:
                    modifier.value >= 0
                        ? `${modifier.title} +${modifier.value}`
                        : `${modifier.title} -${modifier.value}`,
                title: modifier.title
            }
        ];
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
        rollResult.dice[0].options.appearance = {
            colorset: 'inspired',
            foreground: '#FFFFFF',
            background: '#008080',
            outline: '#000000',
            edge: '#806400',
            texture: 'bloodmoon',
            material: 'metal',
            font: 'Arial Black',
            system: 'standard'
        };
        if (advantageDice || disadvantageDice) {
            rollResult.dice[1].options.appearance = {
                colorset: 'inspired',
                foreground: disadvantageDice ? '#b30000' : '#FFFFFF',
                background: '#008080',
                outline: disadvantageDice ? '#000000' : '#000000',
                edge: '#806400',
                texture: 'bloodmoon',
                material: 'metal',
                font: 'Arial Black',
                system: 'standard'
            };
            rollResult.dice[2].options.appearance = {
                colorset: 'bloodmoon',
                foreground: '#000000',
                background: '#430070',
                outline: '#b30000',
                edge: '#000000',
                texture: 'bloodmoon',
                material: 'metal',
                font: 'Arial Black',
                system: 'standard'
            };
        } else {
            rollResult.dice[1].options.appearance = {
                colorset: 'bloodmoon',
                foreground: '#000000',
                background: '#430070',
                outline: '#b30000',
                edge: '#000000',
                texture: 'bloodmoon',
                material: 'metal',
                font: 'Arial Black',
                system: 'standard'
            };
        }

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
        const msg = new cls({
            type: 'damageRoll',
            user: game.user.id,
            sound: CONFIG.sounds.dice,
            system: {
                title: game.i18n.format('DAGGERHEART.Chat.DamageRoll.Title', { damage: title }),
                roll: rollString,
                damage: {
                    total: rollResult.total,
                    type: damage.type
                },
                dice: dice,
                modifiers: modifiers,
                targets: targets
            },
            content: 'systems/daggerheart/templates/chat/damage-roll.hbs',
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
            'system.resources.health.value': Math.min(
                this.system.resources.health.value + hpDamage,
                this.system.resources.health.max
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
                update = { 'system.resources.health.value': Math.max(this.system.resources.health.value - healing, 0) };
                break;
            case SYSTEM.GENERAL.healingTypes.stress.id:
                update = { 'system.resources.stress.value': Math.max(this.system.resources.stress.value - healing, 0) };
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
            if (this.system.resources[action.cost.type].value < action.cost.value - 1) {
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
                content: await renderTemplate('systems/daggerheart/templates/chat/damage-roll.hbs', {
                    roll: roll.formula,
                    total: roll.result,
                    type: action.damage.type
                })
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
                content: await renderTemplate('systems/daggerheart/templates/chat/healing-roll.hbs', {
                    roll: roll.formula,
                    total: roll.result,
                    type: action.healing.type
                })
            });

            cls.create(msg.toObject());
        }
    }
}
