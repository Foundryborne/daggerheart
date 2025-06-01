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
            const levelTiers = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers);
            const passedLevelTiers = Object.values(levelTiers.tiers)
                .filter(x => newLevel <= x.levels.end)
                .map(x => x.levels.start);
            const firstPassedLevelTier = passedLevelTiers.length > 0 ? Math.min(...passedLevelTiers) : null;

            const changes = this.getLevelChangedFeatures(
                newLevel,
                this.system.levelData.level.changed,
                this.system.levelData.levelups
            );

            for (var domainCard of changes.domainCards) {
                const uuid = domainCard.itemUuid ? domainCard.itemUuid : domainCard.uuid;
                const itemCard = await this.items.find(x => x.uuid === uuid);
                itemCard.delete();
            }

            var traitsUpdate = changes.traits.reduce((acc, trait) => {
                const currentTrait = this.system.traits[trait.data];
                acc[trait.data] = {
                    bonus: currentTrait.bonus - 1,
                    tierMarked: trait.first
                        ? !firstPassedLevelTier || trait.level <= firstPassedLevelTier
                            ? true
                            : false
                        : currentTrait.tierMarked
                };

                return acc;
            }, {});

            const newExperienceKeys = Object.keys(changes.experiences);
            const experienceUpdate = this.system.experiences.filter(x => !newExperienceKeys.includes(x.id));
            for (var experience of changes.experienceIncreases) {
                for (var id of experience.data) {
                    const existingExperience = experienceUpdate.find(x => x.id === id);
                    existingExperience.value -= experience.value;
                }
            }

            for (var subclass of changes.subclasses) {
                /* Implemented after datamodel rework is in */
            }

            if (changes.multiclass) {
                /* Implemented after datamodel rework is in */
            }

            const newLevelData = {
                level: {
                    current: newLevel,
                    changed: newLevel
                },
                levelups: Object.keys(this.system.levelData.levelups).reduce((acc, levelKey) => {
                    const level = Number(levelKey);
                    if (level > newLevel) acc[`-=${level}`] = null;

                    return acc;
                }, {})
            };
            await this.update({
                system: {
                    'traits': traitsUpdate,
                    'experiences': experienceUpdate,
                    'resources': {
                        hitPoints: {
                            bonus: this.system.resources.hitPoints.bonus - changes.hitPoint
                        },
                        stress: {
                            bonus: this.system.resources.stress.bonus - changes.stress
                        }
                    },
                    'evasion.bonus': this.system.evasion.bonus - changes.evasion,
                    'proficiency.bonus': this.system.proficiency.bonus - changes.proficiency,
                    'levelData': newLevelData
                }
            });
        }
    }

    getLevelChangedFeatures(startLevel, endLevel, levelData) {
        const changedFeatures = {
            hitPoint: 0,
            stress: 0,
            evasion: 0,
            proficiency: 0,
            domainCards: [],
            multiclass: null,
            subclasses: [],
            traits: [],
            experiences: {},
            experienceIncreases: []
        };

        for (var level = startLevel + 1; level <= endLevel; level++) {
            if (!levelData[level]) continue;

            const achievements = levelData[level].achievements;
            const selections = levelData[level].selections.reduce((acc, selection) => {
                if (!acc[selection.type]) acc[selection.type] = [selection];
                else acc[selection.type].push(selection);

                return acc;
            }, {});

            changedFeatures.hitPoint += selections.hitPoint
                ? selections.hitPoint.reduce((acc, hp) => acc + Number(hp.value), 0)
                : 0;
            changedFeatures.stress += selections.stress
                ? selections.stress.reduce((acc, stress) => acc + Number(stress.value), 0)
                : 0;
            changedFeatures.evasion += selections.evasion
                ? selections.evasion.reduce((acc, evasion) => acc + Number(evasion.value), 0)
                : 0;
            changedFeatures.proficiency +=
                (achievements?.proficiency ?? 0) +
                (selections.proficiency
                    ? selections.proficiency.reduce((acc, proficiency) => acc + Number(proficiency.value), 0)
                    : 0);
            changedFeatures.domainCards.push(
                ...[
                    ...levelData[level].domainCards,
                    ...(selections.domainCard?.flatMap(x => x.data.map(data => ({ ...x, data: data }))) ?? [])
                ]
            );
            changedFeatures.traits.push(
                ...(selections.trait
                    ? selections.trait.flatMap(x =>
                          x.data.map(data => ({
                              level: x.level,
                              data: data,
                              first: level === startLevel,
                              last: level === endLevel
                          }))
                      )
                    : [])
            );
            changedFeatures.experiences = Object.keys(achievements?.experiences ? achievements.experiences : {}).reduce(
                (acc, key) => {
                    acc[key] = achievements.experiences[key];

                    return acc;
                },
                changedFeatures.experiences
            );
            changedFeatures.experienceIncreases.push(...(selections.experience ?? []));
            changedFeatures.subclasses.push(...(selections.subclasses ? [] : []));
            changedFeatures.multiclass = selections.multiclass ? selections.multiclass[0] : null;
        }

        return changedFeatures;
    }

    async levelUp(levelupData) {
        const levelTiers = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers);
        const passedLevelTiers = Object.values(levelTiers.tiers)
            .filter(x => this.system.levelData.level.changed >= x.levels.start)
            .map(x => x.levels.start);
        const lastPassedLevelTier = passedLevelTiers.length > 0 ? Math.max(...passedLevelTiers) : null;

        const changes = this.getLevelChangedFeatures(
            this.system.levelData.level.current,
            this.system.levelData.level.changed,
            levelupData
        );

        for (var card of changes.domainCards) {
            const fromAchievement = Boolean(card.uuid);
            const domainCard = await foundry.utils.fromUuid(fromAchievement ? card.uuid : card.data);
            const createdCards = await this.createEmbeddedDocuments('Item', [domainCard]);
            const newCard = createdCards[0];
            if (fromAchievement) {
                const levelupCard = levelupData[card.level].domainCards.find(
                    x => x.tier === card.tier && x.level === card.level
                );
                if (levelupCard) levelupCard.itemUuid = newCard.uuid;
            } else {
                const levelupCard = levelupData[card.level].selections.find(
                    x =>
                        x.tier === card.tier &&
                        x.level === card.level &&
                        x.optionKey === card.optionKey &&
                        x.checkboxNr === card.checkboxNr
                );
                if (levelupCard) levelupCard.uuid = newCard.uuid;
            }
        }

        var traitsUpdate = changes.traits.reduce((acc, trait) => {
            const currentTrait = this.system.traits[trait.data];
            acc[`${trait.data}`] = {
                bonus: currentTrait.bonus + 1,
                tierMarked: trait.last
                    ? !lastPassedLevelTier || trait.level >= lastPassedLevelTier
                        ? true
                        : false
                    : currentTrait.tierMarked
            };
            return acc;
        }, {});

        const experienceUpdate = this.system.experiences;
        const newExperienceKeys = Object.keys(changes.experiences);
        for (var key of newExperienceKeys) {
            const experience = changes.experiences[key];
            experienceUpdate.push({ id: key, description: experience.name, value: experience.modifier });
        }

        for (var experience of changes.experienceIncreases) {
            for (var id of experience.data) {
                const existingExperience = experienceUpdate.find(x => x.id === id);
                existingExperience.value += experience.value;
            }
        }

        for (var subclass of changes.subclasses) {
            /* Implemented after datamodel rework is in */
        }

        if (changes.multiclass) {
            /* Implemented after datamodel rework is in */
        }

        await this.update({
            system: {
                'traits': traitsUpdate,
                'experiences': experienceUpdate,
                'resources': {
                    hitPoints: {
                        bonus: this.system.resources.hitPoints.bonus + changes.hitPoint
                    },
                    stress: {
                        bonus: this.system.resources.stress.bonus + changes.stress
                    }
                },
                'evasion.bonus': this.system.evasion.bonus + changes.evasion,
                'proficiency.bonus': this.system.proficiency.bonus + changes.proficiency,
                'levelData': {
                    'level.current': this.system.levelData.level.changed,
                    'levelups': levelupData
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
