import { getPathValue, getTier } from '../helpers/utils.mjs';

const fields = foundry.data.fields;

const attributeField = () =>
    new fields.SchemaField({
        data: new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true }),
            base: new fields.NumberField({ initial: 0, integer: true }),
            bonus: new fields.NumberField({ initial: 0, integer: true }),
            actualValue: new fields.NumberField({ initial: 0, integer: true }),
            overrideValue: new fields.NumberField({ initial: 0, integer: true })
        }),
        levelMarks: new fields.ArrayField(new fields.NumberField({ nullable: true, initial: null, integer: true })),
        levelMark: new fields.NumberField({ nullable: true, initial: null, integer: true })
    });

const levelUpTier = () => ({
    attributes: new fields.TypedObjectField(new fields.BooleanField()),
    hitPointSlots: new fields.TypedObjectField(new fields.BooleanField()),
    stressSlots: new fields.TypedObjectField(new fields.BooleanField()),
    experiences: new fields.TypedObjectField(new fields.ArrayField(new fields.StringField({}))),
    proficiency: new fields.TypedObjectField(new fields.BooleanField()),
    armorOrEvasionSlot: new fields.TypedObjectField(new fields.StringField({})),
    subclass: new fields.TypedObjectField(
        new fields.SchemaField({
            multiclass: new fields.BooleanField(),
            feature: new fields.StringField({})
        })
    ),
    multiclass: new fields.TypedObjectField(new fields.BooleanField())
});

export default class DhpPC extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            resources: new fields.SchemaField({
                health: new fields.SchemaField({
                    value: new fields.NumberField({ initial: 0, integer: true }),
                    min: new fields.NumberField({ initial: 0, integer: true }),
                    max: new fields.NumberField({ initial: 6, integer: true })
                }),
                stress: new fields.SchemaField({
                    value: new fields.NumberField({ initial: 0, integer: true }),
                    min: new fields.NumberField({ initial: 0, integer: true }),
                    max: new fields.NumberField({ initial: 6, integer: true })
                }),
                hope: new fields.SchemaField({
                    value: new fields.NumberField({ initial: -1, integer: true }), // FIXME. Logic is gte and needs -1 in PC/Hope. Change to 0
                    min: new fields.NumberField({ initial: 0, integer: true })
                })
            }),
            bonuses: new fields.SchemaField({
                damage: new fields.ArrayField(
                    new fields.SchemaField({
                        value: new fields.NumberField({ integer: true, initial: 0 }),
                        type: new fields.StringField({ nullable: true }),
                        initiallySelected: new fields.BooleanField(),
                        hopeIncrease: new fields.StringField({ initial: null, nullable: true }),
                        description: new fields.StringField({})
                    })
                )
            }),
            attributes: new fields.SchemaField({
                agility: attributeField(),
                strength: attributeField(),
                finesse: attributeField(),
                instinct: attributeField(),
                presence: attributeField(),
                knowledge: attributeField()
            }),
            proficiency: new fields.SchemaField({
                value: new fields.NumberField({ initial: 1, integer: true }),
                min: new fields.NumberField({ initial: 1, integer: true }),
                max: new fields.NumberField({ initial: 6, integer: true })
            }),
            evasion: new fields.NumberField({ initial: 0, integer: true }),
            experiences: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    level: new fields.NumberField({ required: true, integer: true }),
                    description: new fields.StringField({}),
                    value: new fields.NumberField({ integer: true, nullable: true, initial: null })
                }),
                {
                    initial: [
                        { id: foundry.utils.randomID(), level: 1, description: '', value: 2 },
                        { id: foundry.utils.randomID(), level: 1, description: '', value: 2 }
                    ]
                }
            ),
            gold: new fields.SchemaField({
                coins: new fields.NumberField({ initial: 0, integer: true }),
                handfulls: new fields.NumberField({ initial: 0, integer: true }),
                bags: new fields.NumberField({ initial: 0, integer: true }),
                chests: new fields.NumberField({ initial: 0, integer: true })
            }),
            pronouns: new fields.StringField({}),
            domainData: new fields.SchemaField({
                maxLoadout: new fields.NumberField({ initial: 2, integer: true }),
                maxCards: new fields.NumberField({ initial: 2, integer: true })
            }),
            levelData: new fields.SchemaField({
                currentLevel: new fields.NumberField({ initial: 1, integer: true }),
                changedLevel: new fields.NumberField({ initial: 1, integer: true }),
                levelups: new fields.TypedObjectField(
                    new fields.SchemaField({
                        level: new fields.NumberField({ required: true, integer: true }),
                        tier1: new fields.SchemaField({
                            ...levelUpTier()
                        }),
                        tier2: new fields.SchemaField(
                            {
                                ...levelUpTier()
                            },
                            { nullable: true, initial: null }
                        ),
                        tier3: new fields.SchemaField(
                            {
                                ...levelUpTier()
                            },
                            { nullable: true, initial: null }
                        )
                    })
                )
            }),
            story: new fields.SchemaField({
                background: new fields.HTMLField(),
                appearance: new fields.HTMLField(),
                connections: new fields.HTMLField(),
                scars: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        description: new fields.HTMLField()
                    })
                )
            }),
            description: new fields.StringField({}),
            //Temporary until new FoundryVersion fix --> See Armor.Mjs DataPreparation
            armorMarks: new fields.SchemaField({
                max: new fields.NumberField({ initial: 6, integer: true }),
                value: new fields.NumberField({ initial: 0, integer: true })
            })
        };
    }

    get canLevelUp() {
        //  return Object.values(this.levels.data).some(x => !x.completed);
        return this.levelData.currentLevel !== this.levelData.changedLevel;
    }

    get tier() {
        return this.#getTier(this.levelData.currentLevel);
    }

    get ancestry() {
        return this.parent.items.find(x => x.type === 'ancestry') ?? null;
    }

    get class() {
        return this.parent.items.find(x => x.type === 'class' && !x.system.multiclass) ?? null;
    }

    get multiclass() {
        return this.parent.items.find(x => x.type === 'class' && x.system.multiclass) ?? null;
    }

    get multiclassSubclass() {
        return this.parent.items.find(x => x.type === 'subclass' && x.system.multiclass) ?? null;
    }

    get subclass() {
        return this.parent.items.find(x => x.type === 'subclass' && !x.system.multiclass) ?? null;
    }

    get subclassFeatures() {
        const subclass = this.subclass;
        const multiclass = this.multiclassSubclass;
        const subclassItems = this.parent.items.filter(x => x.type === 'feature' && x.system.type === 'subclass');
        return {
            subclass: !subclass
                ? {}
                : {
                      foundation: subclassItems.filter(x =>
                          subclass.system.foundationFeature.abilities.some(ability => ability.uuid === x.uuid)
                      ),
                      specialization: subclassItems.filter(x =>
                          subclass.system.specializationFeature.abilities.some(ability => ability.uuid === x.uuid)
                      ),
                      mastery: subclassItems.filter(x =>
                          subclass.system.masteryFeature.abilities.some(ability => ability.uuid === x.uuid)
                      )
                  },
            multiclassSubclass: !multiclass
                ? {}
                : {
                      foundation: subclassItems.filter(x =>
                          multiclass.system.foundationFeature.abilities.some(ability => ability.uuid === x.uuid)
                      ),
                      specialization: subclassItems.filter(x =>
                          multiclass.system.specializationFeature.abilities.some(ability => ability.uuid === x.uuid)
                      ),
                      mastery: subclassItems.filter(x =>
                          multiclass.system.masteryFeature.abilities.some(ability => ability.uuid === x.uuid)
                      )
                  }
        };
    }

    get community() {
        return this.parent.items.find(x => x.type === 'community') ?? null;
    }

    get classFeatures() {
        return this.parent.items.filter(
            x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.class.id && !x.system.multiclass
        );
    }

    get multiclassFeatures() {
        return this.parent.items.filter(
            x => x.type === 'feature' && x.system.type === SYSTEM.ITEM.featureTypes.class.id && x.system.multiclass
        );
    }

    get domains() {
        const classDomains = this.class ? this.class.system.domains : [];
        const multiclassDomains = this.multiclass ? this.multiclass.system.domains : [];
        return [...classDomains, ...multiclassDomains];
    }

    get domainCards() {
        const domainCards = this.parent.items.filter(x => x.type === 'domainCard');
        const loadout = domainCards.filter(x => !x.system.inVault);
        const vault = domainCards.filter(x => x.system.inVault);

        return {
            loadout: loadout,
            vault: vault,
            total: [...loadout, ...vault]
        };
    }

    get armor() {
        return this.parent.items.find(x => x.type === 'armor');
    }

    get activeWeapons() {
        const primaryWeapon = this.parent.items.find(
            x => x.type === 'weapon' && x.system.active && !x.system.secondary
        );
        const secondaryWeapon = this.parent.items.find(
            x => x.type === 'weapon' && x.system.active && x.system.secondary
        );
        return {
            primary: this.#weaponData(primaryWeapon),
            secondary: this.#weaponData(secondaryWeapon),
            burden: this.getBurden(primaryWeapon, secondaryWeapon)
        };
    }

    get inventoryWeapons() {
        const inventoryWeaponFirst = this.parent.items.find(x => x.type === 'weapon' && x.system.inventoryWeapon === 1);
        const inventoryWeaponSecond = this.parent.items.find(
            x => x.type === 'weapon' && x.system.inventoryWeapon === 2
        );
        return {
            first: this.#weaponData(inventoryWeaponFirst),
            second: this.#weaponData(inventoryWeaponSecond)
        };
    }

    get totalAttributeMarks() {
        return Object.keys(this.levelData.levelups).reduce((nr, level) => {
            const nrAttributeMarks = Object.keys(this.levelData.levelups[level]).reduce((nr, tier) => {
                nr += Object.keys(this.levelData.levelups[level][tier]?.attributes ?? {}).length * 2;

                return nr;
            }, 0);

            nr.push(...Array(nrAttributeMarks).fill(Number.parseInt(level)));

            return nr;
        }, []);
    }

    get availableAttributeMarks() {
        const attributeMarks = Object.keys(this.attributes).flatMap(y => this.attributes[y].levelMarks);
        return this.totalAttributeMarks.reduce((acc, attribute) => {
            if (!attributeMarks.findSplice(x => x === attribute)) {
                acc.push(attribute);
            }

            return acc;
        }, []);
    }

    get effects() {
        return this.parent.items.reduce((acc, item) => {
            const effects = item.system.effectData;
            if (effects && !item.system.disabled) {
                for (var key in effects) {
                    const effect = effects[key];
                    for (var effectEntry of effect) {
                        if (!acc[key]) acc[key] = [];
                        acc[key].push({ name: item.name, value: effectEntry });
                    }
                }
            }

            return acc;
        }, {});
    }

    get refreshableFeatures() {
        return this.parent.items.reduce(
            (acc, x) => {
                if (x.type === 'feature' && x.system.refreshData.type) {
                    acc[x.system.refreshData.type].push(x);
                }

                return acc;
            },
            { shortRest: [], longRest: [] }
        );
    }

    #weaponData(weapon) {
        return weapon
            ? {
                  name: weapon.name,
                  trait: CONFIG.daggerheart.ACTOR.abilities[weapon.system.trait].name, //Should not be done in data?
                  range: CONFIG.daggerheart.GENERAL.range[weapon.system.range],
                  damage: {
                      value: weapon.system.damage.value,
                      type: CONFIG.daggerheart.GENERAL.damageTypes[weapon.system.damage.type]
                  },
                  feature: CONFIG.daggerheart.ITEM.weaponFeatures[weapon.system.feature],
                  img: weapon.img,
                  uuid: weapon.uuid
              }
            : null;
    }

    prepareDerivedData() {
        this.resources.hope.max = 6 - this.story.scars.length;
        if (this.resources.hope.value >= this.resources.hope.max) {
            this.resources.hope.value = Math.max(this.resources.hope.max - 1, 0);
        }

        for (var attributeKey in this.attributes) {
            const attribute = this.attributes[attributeKey];

            attribute.levelMark = attribute.levelMarks.find(x => this.isSameTier(x)) ?? null;

            const actualValue = attribute.data.base + attribute.levelMarks.length + attribute.data.bonus;
            attribute.data.actualValue = actualValue;
            attribute.data.value = attribute.data.overrideValue
                ? attribute.data.overrideValue
                : attribute.data.actualValue;
        }

        this.evasion = this.class?.system?.evasion ?? 0;
        // this.armor.value = this.activeArmor?.baseScore ?? 0;
        this.damageThresholds = this.computeDamageThresholds();

        this.applyLevels();
        this.applyEffects();
    }

    computeDamageThresholds() {
        // TODO: missing weapon features and domain cards calculation
        if (!this.armor) {
            return {
                major: this.levelData.currentLevel,
                severe: this.levelData.currentLevel * 2
            };
        }
        const {
            baseThresholds: { major = 0, severe = 0 }
        } = this.armor.system;
        return {
            major: major + this.levelData.currentLevel,
            severe: severe + this.levelData.currentLevel
        };
    }

    applyLevels() {
        let healthBonus = 0,
            stressBonus = 0,
            proficiencyBonus = 0,
            evasionBonus = 0,
            armorBonus = 0;
        let experienceBonuses = {};
        let advancementFirst = null,
            advancementSecond = null;
        for (var level in this.levelData.levelups) {
            var levelData = this.levelData.levelups[level];
            for (var tier in levelData) {
                var tierData = levelData[tier];
                if (tierData) {
                    healthBonus += Object.keys(tierData.hitPointSlots).length;
                    stressBonus += Object.keys(tierData.stressSlots).length;
                    proficiencyBonus += Object.keys(tierData.proficiency).length;
                    advancementFirst =
                        Object.keys(tierData.subclass).length > 0 && level >= 5 && level <= 7
                            ? { ...tierData.subclass[0], tier: getTier(Number.parseInt(level), true) }
                            : advancementFirst;
                    advancementSecond =
                        Object.keys(tierData.subclass).length > 0 && level >= 8 && level <= 10
                            ? { ...tierData.subclass[0], tier: getTier(Number.parseInt(level), true) }
                            : advancementSecond;

                    for (var index in Object.keys(tierData.experiences)) {
                        for (var experienceKey in tierData.experiences[index]) {
                            var experience = tierData.experiences[index][experienceKey];
                            experienceBonuses[experience] = experienceBonuses[experience]
                                ? experienceBonuses[experience] + 1
                                : 1;
                        }
                    }

                    evasionBonus += Object.keys(tierData.armorOrEvasionSlot).filter(
                        x => tierData.armorOrEvasionSlot[x] === 'evasion'
                    ).length;
                    armorBonus += Object.keys(tierData.armorOrEvasionSlot).filter(
                        x => tierData.armorOrEvasionSlot[x] === 'armor'
                    ).length;
                }
            }
        }

        this.resources.health.max += healthBonus;
        this.resources.stress.max += stressBonus;
        this.proficiency.value += proficiencyBonus;
        this.evasion += evasionBonus;
        this.armorMarks = {
            max: this.armor ? this.armor.system.marks.max + armorBonus : 0,
            value: this.armor ? this.armor.system.marks.value : 0
        };

        this.experiences = this.experiences.map(x => ({ ...x, value: x.value + (experienceBonuses[x.id] ?? 0) }));

        const subclassFeatures = this.subclassFeatures;
        if (advancementFirst) {
            if (advancementFirst.multiclass) {
                this.multiclassSubclass.system[`${advancementFirst.feature}Feature`].unlocked = true;
                this.multiclassSubclass.system[`${advancementFirst.feature}Feature`].tier = advancementFirst.tier;
                subclassFeatures.multiclassSubclass[advancementFirst.feature].forEach(x => (x.system.disabled = false));
            } else {
                this.subclass.system[`${advancementFirst.feature}Feature`].unlocked = true;
                this.subclass.system[`${advancementFirst.feature}Feature`].tier = advancementFirst.tier;
                subclassFeatures.subclass[advancementFirst.feature].forEach(x => (x.system.disabled = false));
            }
        }
        if (advancementSecond) {
            if (advancementSecond.multiclass) {
                this.multiclassSubclass.system[`${advancementSecond.feature}Feature`].unlocked = true;
                this.multiclassSubclass.system[`${advancementSecond.feature}Feature`].tier = advancementSecond.tier;
                subclassFeatures.multiclassSubclass[advancementSecond.feature].forEach(
                    x => (x.system.disabled = false)
                );
            } else {
                this.subclass.system[`${advancementSecond.feature}Feature`].unlocked = true;
                this.subclass.system[`${advancementSecond.feature}Feature`].tier = advancementSecond.tier;
                subclassFeatures.subclass[advancementSecond.feature].forEach(x => (x.system.disabled = false));
            }
        }

        //General progression
        for (var i = 0; i < this.levelData.currentLevel; i++) {
            const tier = getTier(i + 1);
            if (tier !== 'tier0') {
                this.domainData.maxLoadout = Math.min(this.domainData.maxLoadout + 1, 5);
                this.domainData.maxCards += 1;
            }
        }
    }

    applyEffects() {
        const effects = this.effects;
        for (var key in effects) {
            const effectType = effects[key];
            for (var effect of effectType) {
                switch (key) {
                    case SYSTEM.EFFECTS.effectTypes.health.id:
                        this.resources.health.max += effect.value.valueData.value;
                        break;
                    case SYSTEM.EFFECTS.effectTypes.stress.id:
                        this.resources.stress.max += effect.value.valueData.value;
                        break;
                    case SYSTEM.EFFECTS.effectTypes.damage.id:
                        this.bonuses.damage.push({
                            value: getPathValue(effect.value.valueData.value, this),
                            type: 'physical',
                            description: effect.name,
                            hopeIncrease: effect.value.valueData.hopeIncrease,
                            initiallySelected: effect.value.initiallySelected,
                            appliesOn: effect.value.appliesOn
                        });
                }
            }
        }
    }

    getBurden(primary, secondary) {
        const twoHanded =
            primary?.system?.burden === 'twoHanded' ||
            secondary?.system?.burden === 'twoHanded' ||
            (primary?.system?.burden === 'oneHanded' && secondary?.system?.burden === 'oneHanded');
        const oneHanded =
            !twoHanded && (primary?.system?.burden === 'oneHanded' || secondary?.system?.burden === 'oneHanded');

        return twoHanded ? 'twoHanded' : oneHanded ? 'oneHanded' : null;
    }

    isSameTier(level) {
        return this.#getTier(this.levelData.currentLevel) === this.#getTier(level);
    }

    #getTier(level) {
        if (level >= 8) return 3;
        else if (level >= 5) return 2;
        else if (level >= 2) return 1;
        else return 0;
    }
}
