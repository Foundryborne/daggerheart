import SelectDialog from '../dialogs/selectDialog.mjs';
import { getTier } from '../helpers/utils.mjs';
import DhpMulticlassDialog from './multiclassDialog.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpLevelup extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.data = foundry.utils.deepClone(actor.system.levelData);
        this.activeLevel = actor.system.levelData.currentLevel + 1;
    }

    get title() {
        return `${this.actor.name} - Level Up`;
    }

    static DEFAULT_OPTIONS = {
        id: 'daggerheart-levelup',
        classes: ['daggerheart', 'views', 'levelup'],
        position: { width: 1200, height: 'auto' },
        window: {
            resizable: true
        },

        actions: {
            toggleBox: this.toggleBox,
            advanceLevel: this.advanceLevel,
            finishLevelup: this.finishLevelup
        }
    };

    static PARTS = {
        form: {
            id: 'levelup',
            template: 'systems/daggerheart/templates/views/levelup.hbs'
        }
    };

    async _prepareContext(_options) {
        let selectedChoices = 0,
            multiclassing = {},
            subclassing = {};
        const leveledTiers = Object.keys(this.data.levelups).reduce(
            (acc, levelKey) => {
                const levelData = this.data.levelups[levelKey];
                ['tier1', 'tier2', 'tier3'].forEach(tierKey => {
                    let tierUpdate = {};
                    const tierData = levelData[tierKey];
                    if (tierData) {
                        tierUpdate = Object.keys(tierData).reduce((acc, propertyKey) => {
                            const values = tierData[propertyKey];
                            const level = Number.parseInt(levelKey);

                            acc[propertyKey] = Object.values(values).map(value => {
                                if (value && level === this.activeLevel) selectedChoices++;
                                if (propertyKey === 'multiclass') multiclassing[levelKey] = true;
                                if (propertyKey === 'subclass') subclassing[tierKey] = true;

                                return { level: level, value: value };
                            });

                            return acc;
                        }, {});
                    }

                    Object.keys(tierUpdate).forEach(propertyKey => {
                        const property = tierUpdate[propertyKey];
                        const propertyValues = foundry.utils.getProperty(acc, `${tierKey}.${propertyKey}`) ?? [];
                        foundry.utils.setProperty(acc, `${tierKey}.${propertyKey}`, [...propertyValues, ...property]);
                    });
                });

                return acc;
            },
            { tier1: {}, tier2: {}, tier3: {} }
        );

        const activeTier = getTier(this.activeLevel);
        const data = Object.keys(SYSTEM.ACTOR.levelupData).reduce((acc, tierKey) => {
            const tier = SYSTEM.ACTOR.levelupData[tierKey];
            acc[tierKey] = {
                label: game.i18n.localize(tier.label),
                info: game.i18n.localize(tier.info),
                pretext: game.i18n.localize(tier.pretext),
                postext: game.i18n.localize(tier.posttext),
                active: tierKey <= activeTier,
                choices: Object.keys(tier.choices).reduce((acc, propertyKey) => {
                    const property = tier.choices[propertyKey];
                    acc[propertyKey] = { description: property.description, cost: property.cost ?? 1, values: [] };
                    for (var i = 0; i < property.maxChoices; i++) {
                        const leveledValue = leveledTiers[tierKey][propertyKey]?.[i];
                        const subclassLock =
                            propertyKey === 'subclass' &&
                            Object.keys(multiclassing).find(x => getTier(Number.parseInt(x)) === tierKey);
                        const subclassMulticlassLock = propertyKey === 'multiclass' && subclassing[tierKey];
                        const multiclassLock =
                            propertyKey === 'multiclass' &&
                            Object.keys(multiclassing).length > 0 &&
                            !(
                                leveledValue &&
                                Object.keys(multiclassing).find(x => Number.parseInt(x) === leveledValue.level)
                            );
                        const locked =
                            (leveledValue && leveledValue.level !== this.activeLevel) ||
                            subclassLock ||
                            subclassMulticlassLock ||
                            multiclassLock;
                        const disabled =
                            tierKey > activeTier ||
                            (selectedChoices === 2 && !(leveledValue && leveledValue.level === this.activeLevel)) ||
                            locked;

                        acc[propertyKey].values.push({
                            selected: leveledValue?.value !== undefined,
                            path: `levelups.${this.activeLevel}.${tierKey}.${propertyKey}.${i}`,
                            description: game.i18n.localize(property.description),
                            disabled: disabled,
                            locked: locked
                        });
                    }

                    return acc;
                }, {})
            };

            return acc;
        }, {});

        return {
            data: data,
            activeLevel: this.activeLevel,
            changedLevel: this.actor.system.levelData.changedLevel,
            completedSelection: selectedChoices === 2
        };
    }

    static async toggleBox(_, button) {
        const path = button.dataset.path;
        if (foundry.utils.getProperty(this.data, path)) {
            const pathParts = path.split('.');
            const arrayPart = pathParts.slice(0, pathParts.length - 1).join('.');
            let array = foundry.utils.getProperty(this.data, arrayPart);
            if (button.dataset.levelAttribute === 'multiclass') {
                array = [];
            } else {
                delete array[Number.parseInt(pathParts[pathParts.length - 1])];
            }
            foundry.utils.setProperty(this.data, arrayPart, array);
        } else {
            const updates = [{ path: path, value: { level: this.activeLevel } }];
            const levelChoices = SYSTEM.ACTOR.levelChoices[button.dataset.levelAttribute];
            if (button.dataset.levelAttribute === 'subclass') {
                if (!this.actor.system.multiclassSubclass) {
                    updates[0].value.value = {
                        multiclass: false,
                        feature: this.actor.system.subclass.system.specializationFeature.unlocked
                            ? 'mastery'
                            : 'specialization'
                    };
                } else {
                    const choices = [
                        { name: this.actor.system.subclass.name, value: this.actor.system.subclass.uuid },
                        {
                            name: this.actor.system.multiclassSubclass.name,
                            value: this.actor.system.multiclassSubclass.uuid
                        }
                    ];
                    const indexes = await SelectDialog.selectItem({
                        actor: this.actor,
                        choices: choices,
                        title: levelChoices.title,
                        nrChoices: 1
                    });
                    if (indexes.length === 0) {
                        this.render();
                        return;
                    }
                    const multiclassSubclass = choices[indexes[0]].name === this.actor.system.multiclassSubclass.name;
                    updates[0].value.value = {
                        multiclass: multiclassSubclass,
                        feature: this.actor.system.multiclassSubclass.system.specializationFeature.unlocked
                            ? 'mastery'
                            : 'specialization'
                    };
                }
            } else if (button.dataset.levelAttribute === 'multiclass') {
                const multiclassAwait = new Promise(resolve => {
                    new DhpMulticlassDialog(this.actor.name, this.actor.system.class, resolve).render(true);
                });
                const multiclassData = await multiclassAwait;
                if (!multiclassData) {
                    this.render();
                    return;
                }

                const pathParts = path.split('.');
                const arrayPart = pathParts.slice(0, pathParts.length - 1).join('.');
                updates[0] = {
                    path: [arrayPart, '0'].join('.'),
                    value: {
                        level: this.activeLevel,
                        value: {
                            class: multiclassData.class,
                            subclass: multiclassData.subclass,
                            domain: multiclassData.domain,
                            level: this.activeLevel
                        }
                    }
                };
                updates[1] = {
                    path: [arrayPart, '1'].join('.'),
                    value: {
                        level: this.activeLevel,
                        value: {
                            class: multiclassData.class,
                            subclass: multiclassData.subclass,
                            domain: multiclassData.domain,
                            level: this.activeLevel
                        }
                    }
                };
            } else {
                if (levelChoices.choices.length > 0) {
                    if (typeof levelChoices.choices === 'string') {
                        const choices = foundry.utils
                            .getProperty(this.actor, levelChoices.choices)
                            .map(x => ({ name: x.description, value: x.id }));
                        const indexes = await SelectDialog.selectItem({
                            actor: this.actor,
                            choices: choices,
                            title: levelChoices.title,
                            nrChoices: levelChoices.nrChoices
                        });
                        if (indexes.length === 0) {
                            this.render();
                            return;
                        }
                        updates[0].value.value = choices
                            .filter((_, index) => indexes.includes(index))
                            .map(x => x.value);
                    } else {
                        const indexes = await SelectDialog.selectItem({
                            actor: this.actor,
                            choices: levelChoices.choices,
                            title: levelChoices.title,
                            nrChoices: levelChoices.nrChoices
                        });
                        if (indexes.length === 0) {
                            this.render();
                            return;
                        }
                        updates[0].value.value = levelChoices.choices[indexes[0]].path;
                    }
                }
            }

            const update = updates.reduce((acc, x) => {
                acc[x.path] = x.value;

                return acc;
            }, {});

            this.data = foundry.utils.mergeObject(this.data, update);
        }

        this.render();
    }

    static advanceLevel() {
        this.activeLevel += 1;
        this.render();
    }

    static async finishLevelup() {
        this.data.currentLevel = this.data.changedLevel;
        let multiclass = null;
        for (var level in this.data.levelups) {
            for (var tier in this.data.levelups[level]) {
                for (var category in this.data.levelups[level][tier]) {
                    for (var value in this.data.levelups[level][tier][category]) {
                        if (category === 'multiclass') {
                            multiclass = this.data.levelups[level][tier][category][value].value;
                            this.data.levelups[level][tier][category][value] = true;
                        } else {
                            this.data.levelups[level][tier][category][value] =
                                this.data.levelups[level][tier][category][value].value ?? true;
                        }
                    }
                }
            }
        }

        const tiersMoved =
            getTier(this.actor.system.levelData.changedLevel, true) -
            getTier(this.actor.system.levelData.currentLevel, true);
        const experiences = Array.from(Array(tiersMoved), (_, index) => ({
            id: foundry.utils.randomID(),
            level: this.actor.system.experiences.length + index * 3,
            description: '',
            value: 1
        }));

        await this.actor.update(
            {
                system: {
                    levelData: this.data,
                    experiences: [...this.actor.system.experiences, ...experiences]
                }
            },
            { diff: false }
        );

        if (!this.actor.multiclass && multiclass) {
            const multiclassClass = (await fromUuid(multiclass.class.uuid)).toObject();
            multiclassClass.system.domains = [multiclass.domain.id];
            multiclassClass.system.multiclass = multiclass.level;

            const multiclassFeatures = [];
            for (var i = 0; i < multiclassClass.system.features.length; i++) {
                const feature = (await fromUuid(multiclassClass.system.features[i].uuid)).toObject();
                feature.system.multiclass = multiclass.level;
                multiclassFeatures.push(feature);
            }

            const multiclassSubclass = (await fromUuid(multiclass.subclass.uuid)).toObject();
            multiclassSubclass.system.multiclass = multiclass.level;

            const multiclassSubclassFeatures = {};
            const features = [
                multiclassSubclass.system.foundationFeature,
                multiclassSubclass.system.specializationFeature,
                multiclassSubclass.system.masteryFeature
            ];
            for (var i = 0; i < features.length; i++) {
                const path = i === 0 ? 'foundationFeature' : i === 1 ? 'specializationFeature' : 'masteryFeature';
                const feature = features[i];
                for (var ability of feature.abilities) {
                    const data = (await fromUuid(ability.uuid)).toObject();
                    if (i > 0) data.system.disabled = true;
                    data.system.multiclass = multiclass.level;
                    if (!multiclassSubclassFeatures[path]) multiclassSubclassFeatures[path] = [data];
                    else multiclassSubclassFeatures[path].push(data);
                    // data.uuid = feature.uuid;

                    // const abilityData = await this._onDropItemCreate(data);
                    // ability.uuid = abilityData[0].uuid;

                    // createdItems.push(abilityData);
                }
            }

            for (let subclassFeaturesKey in multiclassSubclassFeatures) {
                const values = multiclassSubclassFeatures[subclassFeaturesKey];
                const abilityResults = await this.actor.createEmbeddedDocuments('Item', values);
                for (var i = 0; i < abilityResults.length; i++) {
                    multiclassSubclass.system[subclassFeaturesKey].abilities[i].uuid = abilityResults[i].uuid;
                }
            }

            await this.actor.createEmbeddedDocuments('Item', [
                multiclassClass,
                ...multiclassFeatures,
                multiclassSubclass
            ]);
        }

        this.close();
    }
}
