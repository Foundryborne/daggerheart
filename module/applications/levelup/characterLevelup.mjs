import LevelUpBase from './levelup.mjs';
import { DhLevelup } from '../../data/levelup.mjs';
import { abilities, subclassFeatureLabels } from '../../config/actorConfig.mjs';

export default class DhCharacterLevelUp extends LevelUpBase {
    constructor(actor) {
        super(actor);

        this.levelTiers = this.addBonusChoices(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers)
        );
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

                const traits = Object.values(advancementChoices.trait ?? {});
                const traitValues = traits.filter(trait => trait.data.length > 0).flatMap(trait => trait.data);
                context.traits = {
                    values: traitValues,
                    active: traits.length > 0,
                    progress: {
                        selected: traitValues.length,
                        max: traits.reduce((acc, exp) => acc + exp.amount, 0)
                    }
                };

                const experienceIncreases = Object.values(advancementChoices.experience ?? {});
                const experienceIncreaseValues = experienceIncreases
                    .filter(exp => exp.data.length > 0)
                    .flatMap(exp =>
                        exp.data.map(data => {
                            const experience = Object.keys(this.actor.system.experiences).find(x => x === data);
                            return this.actor.system.experiences[experience].name;
                        })
                    );
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

                const allDomainCards = {
                    ...advancementChoices.domainCard,
                    ...currentLevel.achievements.domainCards
                };
                const allDomainCardKeys = Object.keys(allDomainCards);

                const classDomainsData = this.actor.system.class.value.system.domains.map(domain => ({
                    domain,
                    multiclass: false
                }));
                const multiclassDomainsData = (this.actor.system.multiclass?.value?.system?.domains ?? []).map(
                    domain => ({ domain, multiclass: true })
                );
                const domainsData = [...classDomainsData, ...multiclassDomainsData];
                const multiclassDomain = this.levelup.classUpgradeChoices?.multiclass?.domain;
                if (multiclassDomain) {
                    if (!domainsData.some(x => x.domain === multiclassDomain))
                        domainsData.push({ domain: multiclassDomain, multiclass: true });
                }

                context.domainCards = [];
                for (var key of allDomainCardKeys) {
                    const domainCard = allDomainCards[key];
                    if (domainCard.level > this.levelup.endLevel) continue;

                    const uuid = domainCard.data?.length > 0 ? domainCard.data[0] : domainCard.uuid;
                    const card = uuid ? await foundry.utils.fromUuid(uuid) : {};

                    context.domainCards.push({
                        ...(card.toObject?.() ?? card),
                        emptySubtexts: domainsData.map(domain => {
                            const levelBase = domain.multiclass
                                ? Math.ceil(this.levelup.currentLevel / 2)
                                : this.levelup.currentLevel;
                            const levelMax = domainCard.secondaryData?.limit
                                ? Math.min(domainCard.secondaryData.limit, levelBase)
                                : levelBase;

                            return game.i18n.format('DAGGERHEART.APPLICATIONS.Levelup.selections.emptyDomainCardHint', {
                                domain: game.i18n.localize(CONFIG.DH.DOMAIN.allDomains()[domain.domain].label),
                                level: levelMax
                            });
                        }),
                        path: domainCard.data
                            ? `${domainCard.path}.data`
                            : `levels.${domainCard.level}.achievements.domainCards.${key}.uuid`,
                        limit: domainCard.secondaryData?.limit ?? null,
                        compendium: 'domains'
                    });
                }

                const subclassSelections = advancementChoices.subclass?.flatMap(x => x.data) ?? [];
                const possibleSubclasses = [this.actor.system.class.subclass];
                if (this.actor.system.multiclass?.subclass) {
                    possibleSubclasses.push(this.actor.system.multiclass.subclass);
                }

                context.subclassCards = [];
                if (advancementChoices.subclass?.length > 0) {
                    const featureStateIncrease = Object.values(this.levelup.levels).reduce((acc, level) => {
                        acc += Object.values(level.choices).filter(choice => {
                            return Object.values(choice).every(checkbox => checkbox.type === 'subclass');
                        }).length;
                        return acc;
                    }, 0);

                    for (var subclass of possibleSubclasses) {
                        const choice =
                            advancementChoices.subclass.find(x => x.data[0] === subclass.uuid) ??
                            advancementChoices.subclass.find(x => x.data.length === 0);
                        const featureState = subclass.system.featureState + featureStateIncrease;
                        const data = await foundry.utils.fromUuid(subclass.uuid);
                        context.subclassCards.push({
                            ...data.toObject(),
                            path: choice?.path,
                            uuid: data.uuid,
                            selected: subclassSelections.includes(subclass.uuid),
                            featureState: featureState,
                            featureLabel: game.i18n.localize(subclassFeatureLabels[featureState]),
                            isMulticlass: subclass.system.isMulticlass ? 'true' : 'false'
                        });
                    }
                }

                const multiclasses = Object.values(advancementChoices.multiclass ?? {});
                if (multiclasses?.[0]) {
                    const data = multiclasses[0];
                    const multiclass = data.data.length > 0 ? await foundry.utils.fromUuid(data.data[0]) : {};

                    context.multiclass = {
                        ...data,
                        ...(multiclass.toObject?.() ?? multiclass),
                        type: 'multiclass',
                        uuid: multiclass.uuid,
                        domains:
                            multiclass?.system?.domains.map(key => {
                                const domain = CONFIG.DH.DOMAIN.allDomains()[key];
                                const alreadySelected = this.actor.system.class.value.system.domains.includes(key);

                                return {
                                    ...domain,
                                    selected: key === data.secondaryData.domain,
                                    disabled:
                                        (data.secondaryData.domain && key !== data.secondaryData.domain) ||
                                        alreadySelected
                                };
                            }) ?? [],
                        subclasses:
                            multiclass?.system?.subclasses.map(subclass => ({
                                ...subclass,
                                uuid: subclass.uuid,
                                selected: data.secondaryData.subclass === subclass.uuid,
                                disabled: data.secondaryData.subclass && data.secondaryData.subclass !== subclass.uuid
                            })) ?? [],
                        compendium: 'classes',
                        limit: 1
                    };
                }

                break;
            case 'summary':
                const { current: currentActorLevel, changed: changedActorLevel } = this.actor.system.levelData.level;
                const actorArmor = this.actor.system.armor;
                const levelKeys = Object.keys(this.levelup.levels);
                let achivementProficiency = 0;
                const achievementCards = [];
                let achievementExperiences = [];
                for (var levelKey of levelKeys) {
                    const level = this.levelup.levels[levelKey];
                    if (Number(levelKey) < this.levelup.startLevel) continue;

                    achivementProficiency += level.achievements.proficiency ?? 0;
                    const cards = level.achievements.domainCards ? Object.values(level.achievements.domainCards) : null;
                    if (cards) {
                        for (var card of cards) {
                            const itemCard = await foundry.utils.fromUuid(card.uuid);
                            achievementCards.push(itemCard);
                        }
                    }

                    achievementExperiences = level.achievements.experiences
                        ? Object.values(level.achievements.experiences).reduce((acc, experience) => {
                              if (experience.name) acc.push(experience);
                              return acc;
                          }, [])
                        : [];
                }

                context.achievements = {
                    proficiency: {
                        old: this.actor.system.proficiency,
                        new: this.actor.system.proficiency + achivementProficiency,
                        shown: achivementProficiency > 0
                    },
                    damageThresholds: {
                        major: {
                            old: this.actor.system.damageThresholds.major,
                            new: this.actor.system.damageThresholds.major + changedActorLevel - currentActorLevel
                        },
                        severe: {
                            old: this.actor.system.damageThresholds.severe,
                            new:
                                this.actor.system.damageThresholds.severe +
                                (actorArmor
                                    ? changedActorLevel - currentActorLevel
                                    : (changedActorLevel - currentActorLevel) * 2)
                        },
                        unarmored: !actorArmor
                    },
                    domainCards: {
                        values: achievementCards,
                        shown: achievementCards.length > 0
                    },
                    experiences: {
                        values: achievementExperiences,
                        shown: achievementExperiences.length > 0
                    }
                };

                const advancement = {};
                for (var levelKey of levelKeys) {
                    const level = this.levelup.levels[levelKey];
                    if (Number(levelKey) < this.levelup.startLevel) continue;

                    for (var choiceKey of Object.keys(level.choices)) {
                        const choice = level.choices[choiceKey];
                        for (var checkbox of Object.values(choice)) {
                            switch (choiceKey) {
                                case 'proficiency':
                                case 'hitPoint':
                                case 'stress':
                                case 'evasion':
                                    advancement[choiceKey] = advancement[choiceKey]
                                        ? advancement[choiceKey] + Number(checkbox.value)
                                        : Number(checkbox.value);
                                    break;
                                case 'trait':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = {};
                                    for (var traitKey of checkbox.data) {
                                        if (!advancement[choiceKey][traitKey]) advancement[choiceKey][traitKey] = 0;
                                        advancement[choiceKey][traitKey] += 1;
                                    }
                                    break;
                                case 'domainCard':
                                    if (!advancement[choiceKey]) advancement[choiceKey] = [];
                                    if (checkbox.data.length === 1) {
                                        const choiceItem = await foundry.utils.fromUuid(checkbox.data[0]);
                                        advancement[choiceKey].push(choiceItem.toObject());
                                    }
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
                                case 'subclass':
                                    if (checkbox.data[0]) {
                                        const subclassItem = await foundry.utils.fromUuid(checkbox.data[0]);
                                        if (!advancement[choiceKey]) advancement[choiceKey] = [];
                                        advancement[choiceKey].push({
                                            ...subclassItem.toObject(),
                                            featureLabel: game.i18n.localize(
                                                subclassFeatureLabels[Number(checkbox.secondaryData.featureState)]
                                            )
                                        });
                                    }
                                    break;
                                case 'multiclass':
                                    const multiclassItem = await foundry.utils.fromUuid(checkbox.data[0]);
                                    const subclass = multiclassItem
                                        ? await foundry.utils.fromUuid(checkbox.secondaryData.subclass)
                                        : null;
                                    advancement[choiceKey] = multiclassItem
                                        ? {
                                              ...multiclassItem.toObject(),
                                              domain: checkbox.secondaryData.domain
                                                  ? game.i18n.localize(
                                                        CONFIG.DH.DOMAIN.allDomains()[checkbox.secondaryData.domain]
                                                            .label
                                                    )
                                                  : null,
                                              subclass: subclass ? subclass.name : null
                                          }
                                        : {};
                                    break;
                            }
                        }
                    }
                }

                context.advancements = {
                    statistics: {
                        proficiency: {
                            old: context.achievements.proficiency.new,
                            new: context.achievements.proficiency.new + (advancement.proficiency ?? 0)
                        },
                        hitPoints: {
                            old: this.actor.system.resources.hitPoints.max,
                            new: this.actor.system.resources.hitPoints.max + (advancement.hitPoint ?? 0)
                        },
                        stress: {
                            old: this.actor.system.resources.stress.max,
                            new: this.actor.system.resources.stress.max + (advancement.stress ?? 0)
                        },
                        evasion: {
                            old: this.actor.system.evasion,
                            new: this.actor.system.evasion + (advancement.evasion ?? 0)
                        }
                    },
                    traits: Object.keys(this.actor.system.traits).reduce((acc, traitKey) => {
                        if (advancement.trait?.[traitKey]) {
                            if (!acc) acc = {};
                            acc[traitKey] = {
                                label: game.i18n.localize(abilities[traitKey].label),
                                old: this.actor.system.traits[traitKey].value,
                                new: this.actor.system.traits[traitKey].value + advancement.trait[traitKey]
                            };
                        }
                        return acc;
                    }, null),
                    domainCards: advancement.domainCard ?? [],
                    experiences:
                        advancement.experience?.flatMap(x => x.data.map(data => ({ name: data, modifier: x.value }))) ??
                        [],
                    multiclass: advancement.multiclass,
                    subclass: advancement.subclass
                };

                context.advancements.statistics.proficiency.shown =
                    context.advancements.statistics.proficiency.new > context.advancements.statistics.proficiency.old;
                context.advancements.statistics.hitPoints.shown =
                    context.advancements.statistics.hitPoints.new > context.advancements.statistics.hitPoints.old;
                context.advancements.statistics.stress.shown =
                    context.advancements.statistics.stress.new > context.advancements.statistics.stress.old;
                context.advancements.statistics.evasion.shown =
                    context.advancements.statistics.evasion.new > context.advancements.statistics.evasion.old;
                context.advancements.statistics.shown =
                    context.advancements.statistics.proficiency.shown ||
                    context.advancements.statistics.hitPoints.shown ||
                    context.advancements.statistics.stress.shown ||
                    context.advancements.statistics.evasion.shown;

                break;
        }

        return context;
    }
}
