import BaseLevelUp from './levelup.mjs';
import { defaultCompanionTier, LevelOptionType } from '../../data/levelTier.mjs';
import { DhLevelup } from '../../data/levelup.mjs';
import { diceTypes, range } from '../../config/generalConfig.mjs';

export default class DhCompanionLevelUp extends BaseLevelUp {
    constructor(actor) {
        super(actor);

        this.levelTiers = this.addBonusChoices(defaultCompanionTier);
        const playerLevelupData = actor.system.levelData;
        this.levelup = new DhLevelup(DhLevelup.initializeData(this.levelTiers, playerLevelupData));
    }

    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);

        const currentLevel = this.levelup.levels[this.levelup.currentLevel];
        switch (partId) {
            case 'selections':
                const advancementChoices = Object.keys(currentLevel.choices).reduce((acc, choiceKey) => {
                    Object.keys(currentLevel.choices[choiceKey]).forEach(checkboxNr => {
                        const checkbox = currentLevel.choices[choiceKey][checkboxNr];
                        const data = {
                            ...checkbox,
                            path: `levels.${this.levelup.currentLevel}.choices.${choiceKey}.${checkboxNr}`,
                            level: this.levelup.currentLevel
                        };

                        if (!acc[choiceKey]) acc[choiceKey] = [];
                        acc[choiceKey].push(data);
                    });

                    return acc;
                }, {});

                const experienceIncreases = Object.values(advancementChoices.experience ?? {});
                const experienceIncreaseValues = experienceIncreases
                    .filter(exp => exp.data.length > 0)
                    .flatMap(exp => exp.data);
                context.experienceIncreases = {
                    values: experienceIncreaseValues,
                    active: experienceIncreases.length > 0,
                    progress: {
                        selected: experienceIncreaseValues.length,
                        max: experienceIncreases.reduce((acc, exp) => acc + exp.amount, 0)
                    }
                };

                context.newExperiences = Object.keys(currentLevel.achievements.experiences).map(key => {
                    const experience = currentLevel.achievements.experiences[key];
                    return {
                        ...experience,
                        level: this.levelup.currentLevel,
                        key: key
                    };
                });

                context.vicious = advancementChoices.vicious ? Object.values(advancementChoices.vicious) : null;
                context.viciousChoices = {
                    damage: game.i18n.localize('DAGGERHEART.APPLICATIONS.Levelup.selections.viciousDamage'),
                    range: game.i18n.localize('DAGGERHEART.APPLICATIONS.Levelup.selections.viciousRange')
                };

                break;
            case 'summary':
                const levelKeys = Object.keys(this.levelup.levels);
                const actorDamageDice = this.actor.system.attack.damage.parts[0].value.dice;
                const actorRange = this.actor.system.attack.range;

                let achievementExperiences = [];
                for (var levelKey of levelKeys) {
                    const level = this.levelup.levels[levelKey];
                    if (Number(levelKey) < this.levelup.startLevel) continue;

                    achievementExperiences = level.achievements.experiences
                        ? Object.values(level.achievements.experiences).reduce((acc, experience) => {
                              if (experience.name) acc.push(experience);
                              return acc;
                          }, [])
                        : [];
                }
                context.achievements = {
                    experiences: {
                        values: achievementExperiences,
                        shown: achievementExperiences.length > 0
                    }
                };

                context.achievements = context.achievements.experiences.shown ? context.achievements : undefined;

                const advancement = {};
                for (var levelKey of levelKeys) {
                    const level = this.levelup.levels[levelKey];
                    if (Number(levelKey) < this.levelup.startLevel) continue;

                    for (var choiceKey of Object.keys(level.choices)) {
                        const choice = level.choices[choiceKey];
                        for (var checkbox of Object.values(choice)) {
                            switch (choiceKey) {
                                case 'stress':
                                case 'evasion':
                                    advancement[choiceKey] = advancement[choiceKey]
                                        ? advancement[choiceKey] + Number(checkbox.value)
                                        : Number(checkbox.value);
                                    break;
                                case 'experience':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = [];
                                    const data = checkbox.data.map(data => {
                                        const experience = Object.keys(this.actor.system.experiences).find(
                                            x => x === data
                                        );
                                        return this.actor.system.experiences[experience]?.name ?? '';
                                    });
                                    advancement[choiceKey].push({ data: data, value: checkbox.value });
                                    break;
                                case 'vicious':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = { damage: null, range: null };
                                    const isDamage = checkbox.data[0] === 'damage';
                                    const options = isDamage ? diceTypes : range;
                                    const keys = Object.keys(options);
                                    const actorKey = keys.indexOf(isDamage ? actorDamageDice : actorRange);
                                    const currentIndex = advancement[choiceKey][checkbox.data[0]]
                                        ? keys.indexOf(advancement[choiceKey][checkbox.data[0]])
                                        : actorKey;
                                    advancement[choiceKey][checkbox.data[0]] =
                                        options[keys[Math.min(currentIndex + 1, keys.length - 1)]];
                                default:
                                    if (!advancement.simple) advancement.simple = {};
                                    advancement.simple[choiceKey] = game.i18n.localize(
                                        LevelOptionType[checkbox.type].label
                                    );
                                    break;
                            }
                        }
                    }
                }

                context.advancements = {
                    statistics: {
                        stress: {
                            old: this.actor.system.resources.stress.max,
                            new: this.actor.system.resources.stress.max + (advancement.stress ?? 0)
                        },
                        evasion: {
                            old: this.actor.system.evasion,
                            new: this.actor.system.evasion + (advancement.evasion ?? 0)
                        }
                    },
                    experiences:
                        advancement.experience?.flatMap(x => x.data.map(data => ({ name: data, modifier: x.value }))) ??
                        [],
                    vicious: {
                        damage: advancement.vicious?.damage
                            ? {
                                  old: actorDamageDice,
                                  new: advancement.vicious.damage
                              }
                            : null,
                        range: advancement.vicious?.range
                            ? {
                                  old: game.i18n.localize(`DAGGERHEART.CONFIG.Range.${actorRange}.name`),
                                  new: game.i18n.localize(advancement.vicious.range.label)
                              }
                            : null
                    },
                    simple: advancement.simple ?? {}
                };

                context.advancements.statistics.stress.shown =
                    context.advancements.statistics.stress.new > context.advancements.statistics.stress.old;
                context.advancements.statistics.evasion.shown =
                    context.advancements.statistics.evasion.new > context.advancements.statistics.evasion.old;
                context.advancements.statistics.shown =
                    context.advancements.statistics.stress.shown || context.advancements.statistics.evasion.shown;
        }

        return context;
    }
}
