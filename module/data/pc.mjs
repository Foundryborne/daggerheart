import { getPathValue } from '../helpers/utils.mjs';
import { LevelOptionType } from './levelTier.mjs';

const fields = foundry.data.fields;

const attributeField = () =>
    new fields.SchemaField({
        bonus: new fields.NumberField({ initial: 0, integer: true }),
        base: new fields.NumberField({ initial: 0, integer: true }),
        tierMarked: new fields.BooleanField({ required: true, initial: false })
    });

const resourceField = max =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true }),
        bonus: new fields.NumberField({ initial: 0, integer: true }),
        min: new fields.NumberField({ initial: 0, integer: true }),
        baseMax: new fields.NumberField({ initial: max, integer: true })
    });

export default class DhpPC extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            resources: new fields.SchemaField({
                hitPoints: resourceField(6),
                stress: resourceField(6),
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
            traits: new fields.SchemaField({
                agility: attributeField(),
                strength: attributeField(),
                finesse: attributeField(),
                instinct: attributeField(),
                presence: attributeField(),
                knowledge: attributeField()
            }),
            proficiency: new fields.SchemaField({
                base: new fields.NumberField({ required: true, initial: 1, integer: true }),
                bonus: new fields.NumberField({ required: true, initial: 0, integer: true })
            }),
            evasion: new fields.SchemaField({
                bonus: new fields.NumberField({ initial: 0, integer: true })
            }),
            experiences: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    description: new fields.StringField({}),
                    value: new fields.NumberField({ integer: true, nullable: true, initial: null })
                }),
                {
                    initial: [
                        { id: foundry.utils.randomID(), description: '', value: 2 },
                        { id: foundry.utils.randomID(), description: '', value: 2 }
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
            }),
            levelData: new fields.EmbeddedDataField(DhPCLevelData)
        };
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
        return this.parent.items.find(x => x.type === 'armor' && x.system.equipped);
    }

    get equippedWeapons() {
        const primaryWeapon = this.parent.items.find(
            x => x.type === 'weapon' && x.system.equipped && !x.system.secondary
        );
        const secondaryWeapon = this.parent.items.find(
            x => x.type === 'weapon' && x.system.equipped && x.system.secondary
        );
        return {
            primary: this.#weaponData(primaryWeapon),
            secondary: this.#weaponData(secondaryWeapon),
            burden: this.getBurden(primaryWeapon, secondaryWeapon)
        };
    }

    static async unequipBeforeEquip(itemToEquip) {
        const equippedWeapons = this.equippedWeapons;

        if (itemToEquip.system.secondary) {
            if (equippedWeapons.primary && equippedWeapons.primary.burden === SYSTEM.GENERAL.burden.twoHanded.value) {
                await this.parent.items.get(equippedWeapons.primary.id).update({ 'system.equipped': false });
            }

            if (equippedWeapons.secondary) {
                await this.parent.items.get(equippedWeapons.secondary.id).update({ 'system.equipped': false });
            }
        } else {
            if (equippedWeapons.secondary && itemToEquip.system.burden === SYSTEM.GENERAL.burden.twoHanded.value) {
                await this.parent.items.get(equippedWeapons.secondary.id).update({ 'system.equipped': false });
            }

            if (equippedWeapons.primary) {
                await this.parent.items.get(equippedWeapons.primary.id).update({ 'system.equipped': false });
            }
        }
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
                if (x.type === 'feature' && x.system.refreshData?.type === 'feature' && x.system.refreshData?.type) {
                    acc[x.system.refreshData.type].push(x);
                }

                return acc;
            },
            { shortRest: [], longRest: [] }
        );
    }

    //Should not be done in data?
    #weaponData(weapon) {
        return weapon
            ? {
                  id: weapon.id,
                  name: weapon.name,
                  trait: game.i18n.localize(CONFIG.daggerheart.ACTOR.abilities[weapon.system.trait].label),
                  range: CONFIG.daggerheart.GENERAL.range[weapon.system.range],
                  damage: {
                      value: weapon.system.damage.value,
                      type: CONFIG.daggerheart.GENERAL.damageTypes[weapon.system.damage.type]
                  },
                  burden: weapon.system.burden,
                  feature: CONFIG.daggerheart.ITEM.weaponFeatures[weapon.system.feature],
                  img: weapon.img,
                  uuid: weapon.uuid
              }
            : null;
    }

    prepareBaseData() {
        this.resources.hitPoints.max = this.resources.hitPoints.baseMax + this.resources.hitPoints.bonus;
        this.resources.stress.max = this.resources.stress.baseMax + this.resources.stress.bonus;
        this.evasion.value = (this.class?.system?.evasion ?? 0) + this.evasion.bonus;
        this.proficiency.value = this.proficiency.base + this.proficiency.bonus;

        for (var attributeKey in this.traits) {
            const attribute = this.traits[attributeKey];
            attribute.value = attribute.base + attribute.bonus;
        }
    }

    prepareDerivedData() {
        this.resources.hope.max = 6 - this.story.scars.length;
        if (this.resources.hope.value >= this.resources.hope.max) {
            this.resources.hope.value = Math.max(this.resources.hope.max - 1, 0);
        }

        const armor = this.armor;
        this.damageThresholds = {
            major: armor
                ? armor.system.baseThresholds.major + this.levelData.level.current
                : this.levelData.level.current,
            severe: armor
                ? armor.system.baseThresholds.severe + this.levelData.level.current
                : this.levelData.level.current * 2
        };

        this.applyEffects();
    }

    applyEffects() {
        const effects = this.effects;
        for (var key in effects) {
            const effectType = effects[key];
            for (var effect of effectType) {
                switch (key) {
                    case SYSTEM.EFFECTS.effectTypes.health.id:
                        this.resources.hitPoints.bonus += effect.value.valueData.value;
                        break;
                    case SYSTEM.EFFECTS.effectTypes.stress.id:
                        this.resources.stress.bonus += effect.value.valueData.value;
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

    #getTier(level) {
        if (level >= 8) return 3;
        else if (level >= 5) return 2;
        else if (level >= 2) return 1;
        else return 0;
    }
}

class DhPCLevelData extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            level: new fields.SchemaField({
                current: new fields.NumberField({ required: true, integer: true, initial: 1 }),
                changed: new fields.NumberField({ required: true, integer: true, initial: 1 })
            }),
            levelups: new fields.TypedObjectField(
                new fields.SchemaField({
                    achievements: new fields.SchemaField(
                        {
                            experiences: new fields.TypedObjectField(
                                new fields.SchemaField({
                                    name: new fields.StringField({ required: true }),
                                    modifier: new fields.NumberField({ required: true, integer: true })
                                })
                            ),
                            domainCards: new fields.ArrayField(
                                new fields.SchemaField({
                                    uuid: new fields.StringField({ required: true }),
                                    itemUuid: new fields.StringField({ required: true })
                                })
                            ),
                            proficiency: new fields.NumberField({ integer: true })
                        },
                        { nullable: true, initial: null }
                    ),
                    selections: new fields.ArrayField(
                        new fields.SchemaField({
                            tier: new fields.NumberField({ required: true, integer: true }),
                            level: new fields.NumberField({ required: true, integer: true }),
                            optionKey: new fields.StringField({ required: true }),
                            type: new fields.StringField({ required: true, choices: LevelOptionType }),
                            checkboxNr: new fields.NumberField({ required: true, integer: true }),
                            value: new fields.NumberField({ integer: true }),
                            minCost: new fields.NumberField({ integer: true }),
                            amount: new fields.NumberField({ integer: true }),
                            data: new fields.ArrayField(new fields.StringField({ required: true })),
                            secondaryData: new fields.StringField(),
                            itemUuid: new fields.StringField({ required: true })
                        })
                    )
                })
            )
        };
    }

    get canLevelUp() {
        return this.level.current < this.level.changed;
    }
}
