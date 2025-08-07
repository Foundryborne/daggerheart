import { burden } from '../../config/generalConfig.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import DhLevelData from '../levelData.mjs';
import BaseDataActor from './base.mjs';
import { attributeField, resourceField, stressDamageReductionRule, bonusField } from '../fields/actorField.mjs';
import { ActionField } from '../fields/actionField.mjs';
import DHCharacterSettings from '../../applications/sheets-configs/character-settings.mjs';

export default class DhCharacter extends BaseDataActor {
    /**@override */
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Character'];

    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.character',
            type: 'character',
            settingSheet: DHCharacterSettings,
            isNPC: false
        });
    }

    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            resources: new fields.SchemaField({
                hitPoints: resourceField(
                    0,
                    0,
                    'DAGGERHEART.GENERAL.HitPoints.plural',
                    true,
                    'DAGGERHEART.ACTORS.Character.maxHPBonus'
                ),
                stress: resourceField(6, 0, 'DAGGERHEART.GENERAL.stress', true),
                hope: resourceField(6, 2, 'DAGGERHEART.GENERAL.hope')
            }),
            traits: new fields.SchemaField({
                agility: attributeField('DAGGERHEART.CONFIG.Traits.agility.name'),
                strength: attributeField('DAGGERHEART.CONFIG.Traits.strength.name'),
                finesse: attributeField('DAGGERHEART.CONFIG.Traits.finesse.name'),
                instinct: attributeField('DAGGERHEART.CONFIG.Traits.instinct.name'),
                presence: attributeField('DAGGERHEART.CONFIG.Traits.presence.name'),
                knowledge: attributeField('DAGGERHEART.CONFIG.Traits.knowledge.name')
            }),
            proficiency: new fields.NumberField({
                initial: 1,
                integer: true,
                label: 'DAGGERHEART.GENERAL.proficiency'
            }),
            evasion: new fields.NumberField({ initial: 0, integer: true, label: 'DAGGERHEART.GENERAL.evasion' }),
            armorScore: new fields.NumberField({ integer: true, initial: 0, label: 'DAGGERHEART.GENERAL.armorScore' }),
            damageThresholds: new fields.SchemaField({
                severe: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.severeThreshold'
                }),
                major: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.majorThreshold'
                })
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    value: new fields.NumberField({ integer: true, initial: 0 }),
                    description: new fields.StringField()
                })
            ),
            gold: new fields.SchemaField({
                coins: new fields.NumberField({ initial: 0, integer: true }),
                handfulls: new fields.NumberField({ initial: 1, integer: true }),
                bags: new fields.NumberField({ initial: 0, integer: true }),
                chests: new fields.NumberField({ initial: 0, integer: true })
            }),
            scars: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    description: new fields.StringField()
                })
            ),
            biography: new fields.SchemaField({
                background: new fields.HTMLField(),
                connections: new fields.HTMLField(),
                characteristics: new fields.SchemaField({
                    pronouns: new fields.StringField({}),
                    age: new fields.StringField({}),
                    faith: new fields.StringField({})
                })
            }),
            class: new fields.SchemaField({
                value: new ForeignDocumentUUIDField({ type: 'Item', nullable: true }),
                subclass: new ForeignDocumentUUIDField({ type: 'Item', nullable: true })
            }),
            multiclass: new fields.SchemaField({
                value: new ForeignDocumentUUIDField({ type: 'Item', nullable: true }),
                subclass: new ForeignDocumentUUIDField({ type: 'Item', nullable: true })
            }),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    img: 'icons/skills/melee/unarmed-punch-fist-yellow-red.webp',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
                    chatDisplay: false,
                    type: 'attack',
                    range: 'melee',
                    target: {
                        type: 'any',
                        amount: 1
                    },
                    roll: {
                        type: 'attack',
                        trait: 'strength'
                    },
                    damage: {
                        parts: [
                            {
                                type: ['physical'],
                                value: {
                                    custom: {
                                        enabled: true,
                                        formula: '@profd4'
                                    }
                                }
                            }
                        ]
                    }
                }
            }),
            advantageSources: new fields.ArrayField(new fields.StringField(), {
                label: 'DAGGERHEART.ACTORS.Character.advantageSources.label',
                hint: 'DAGGERHEART.ACTORS.Character.advantageSources.hint'
            }),
            disadvantageSources: new fields.ArrayField(new fields.StringField(), {
                label: 'DAGGERHEART.ACTORS.Character.disadvantageSources.label',
                hint: 'DAGGERHEART.ACTORS.Character.disadvantageSources.hint'
            }),
            levelData: new fields.EmbeddedDataField(DhLevelData),
            bonuses: new fields.SchemaField({
                roll: new fields.SchemaField({
                    attack: bonusField('DAGGERHEART.GENERAL.Roll.attack'),
                    spellcast: bonusField('DAGGERHEART.GENERAL.Roll.spellcast'),
                    trait: bonusField('DAGGERHEART.GENERAL.Roll.trait'),
                    action: bonusField('DAGGERHEART.GENERAL.Roll.action'),
                    reaction: bonusField('DAGGERHEART.GENERAL.Roll.reaction'),
                    primaryWeapon: bonusField('DAGGERHEART.GENERAL.Roll.primaryWeaponAttack'),
                    secondaryWeapon: bonusField('DAGGERHEART.GENERAL.Roll.secondaryWeaponAttack')
                }),
                damage: new fields.SchemaField({
                    physical: bonusField('DAGGERHEART.GENERAL.Damage.physicalDamage'),
                    magical: bonusField('DAGGERHEART.GENERAL.Damage.magicalDamage'),
                    primaryWeapon: bonusField('DAGGERHEART.GENERAL.Damage.primaryWeapon'),
                    secondaryWeapon: bonusField('DAGGERHEART.GENERAL.Damage.secondaryWeapon')
                }),
                healing: bonusField('DAGGERHEART.GENERAL.Healing.healingAmount'),
                range: new fields.SchemaField({
                    weapon: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        label: 'DAGGERHEART.GENERAL.Range.weapon'
                    }),
                    spell: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        label: 'DAGGERHEART.GENERAL.Range.spell'
                    }),
                    other: new fields.NumberField({
                        integer: true,
                        initial: 0,
                        label: 'DAGGERHEART.GENERAL.Range.other'
                    })
                }),
                rally: new fields.ArrayField(new fields.StringField(), {
                    label: 'DAGGERHEART.CLASS.Feature.rallyDice'
                }),
                rest: new fields.SchemaField({
                    shortRest: new fields.SchemaField({
                        shortMoves: new fields.NumberField({
                            required: true,
                            integer: true,
                            min: 0,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.shortRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.shortRestMoves.hint'
                        }),
                        longMoves: new fields.NumberField({
                            required: true,
                            integer: true,
                            min: 0,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.longRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.longRestMoves.hint'
                        })
                    }),
                    longRest: new fields.SchemaField({
                        shortMoves: new fields.NumberField({
                            required: true,
                            integer: true,
                            min: 0,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.longRest.shortRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.longRest.shortRestMoves.hint'
                        }),
                        longMoves: new fields.NumberField({
                            required: true,
                            integer: true,
                            min: 0,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.longRest.longRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.longRest.longRestMoves.hint'
                        })
                    })
                }),
                maxLoadout: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    label: 'DAGGERHEART.GENERAL.Bonuses.maxLoadout.label'
                })
            }),
            companion: new ForeignDocumentUUIDField({ type: 'Actor', nullable: true, initial: null }),
            rules: new fields.SchemaField({
                damageReduction: new fields.SchemaField({
                    maxArmorMarked: new fields.SchemaField({
                        value: new fields.NumberField({
                            required: true,
                            integer: true,
                            initial: 1,
                            label: 'DAGGERHEART.GENERAL.Rules.damageReduction.maxArmorMarkedBonus'
                        }),
                        stressExtra: new fields.NumberField({
                            required: true,
                            integer: true,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Rules.damageReduction.maxArmorMarkedStress.label',
                            hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.maxArmorMarkedStress.hint'
                        })
                    }),
                    stressDamageReduction: new fields.SchemaField({
                        severe: stressDamageReductionRule('DAGGERHEART.GENERAL.Rules.damageReduction.stress.severe'),
                        major: stressDamageReductionRule('DAGGERHEART.GENERAL.Rules.damageReduction.stress.major'),
                        minor: stressDamageReductionRule('DAGGERHEART.GENERAL.Rules.damageReduction.stress.minor'),
                        any: stressDamageReductionRule('DAGGERHEART.GENERAL.Rules.damageReduction.stress.any')
                    }),
                    increasePerArmorMark: new fields.NumberField({
                        integer: true,
                        initial: 1,
                        label: 'DAGGERHEART.GENERAL.Rules.damageReduction.increasePerArmorMark.label',
                        hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.increasePerArmorMark.hint'
                    }),
                    magical: new fields.BooleanField({ initial: false }),
                    physical: new fields.BooleanField({ initial: false }),
                    thresholdImmunities: new fields.SchemaField({
                        minor: new fields.BooleanField({ initial: false })
                    }),
                    disabledArmor: new fields.BooleanField({ intial: false })
                }),
                attack: new fields.SchemaField({
                    damage: new fields.SchemaField({
                        diceIndex: new fields.NumberField({
                            integer: true,
                            min: 0,
                            max: 5,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Rules.attack.damage.dice.label',
                            hint: 'DAGGERHEART.GENERAL.Rules.attack.damage.dice.hint'
                        }),
                        bonus: new fields.NumberField({
                            required: true,
                            initial: 0,
                            min: 0,
                            label: 'DAGGERHEART.GENERAL.Rules.attack.damage.bonus.label'
                        })
                    }),
                    roll: new fields.SchemaField({
                        trait: new fields.StringField({
                            required: true,
                            choices: CONFIG.DH.ACTOR.abilities,
                            nullable: true,
                            initial: null,
                            label: 'DAGGERHEART.GENERAL.Rules.attack.roll.trait.label'
                        })
                    })
                }),
                weapon: new fields.SchemaField({
                    /*  Unimplemented 
                        -> Should remove the lowest damage dice from weapon damage 
                        -> Reflect this in the chat message somehow so players get feedback that their choice is helping them.
                    */
                    dropLowestDamageDice: new fields.BooleanField({ initial: false }),
                    /*  Unimplemented 
                        -> Should flip any lowest possible dice rolls for weapon damage to highest
                        -> Reflect this in the chat message somehow so players get feedback that their choice is helping them.
                    */
                    flipMinDiceValue: new fields.BooleanField({ intial: false })
                }),
                runeWard: new fields.BooleanField({ initial: false }),
                burden: new fields.SchemaField({
                    ignore: new fields.BooleanField()
                })
            })
        };
    }

    /* -------------------------------------------- */

    get tier() {
        const currentLevel = this.levelData.level.current;
        return currentLevel === 1
            ? 1
            : Object.values(game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers).find(
                  tier => currentLevel >= tier.levels.start && currentLevel <= tier.levels.end
              ).tier;
    }

    get ancestry() {
        return this.parent.items.find(x => x.type === 'ancestry') ?? null;
    }

    get community() {
        return this.parent.items.find(x => x.type === 'community') ?? null;
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature') ?? [];
    }

    get companionFeatures() {
        return this.companion ? this.companion.items.filter(x => x.type === 'feature') : [];
    }

    get needsCharacterSetup() {
        return !(this.class.value || this.class.subclass || this.ancestry || this.community);
    }

    get spellcastModifierTrait() {
        const subClasses = this.parent.items.filter(x => x.type === 'subclass') ?? [];
        const modifiers = subClasses
            ?.map(sc => ({ ...this.traits[sc.system.spellcastingTrait], key: sc.system.spellcastingTrait }))
            .filter(x => x);
        return modifiers.sort((a, b) => a.value - b.value)[0];
    }

    get spellcastModifier() {
        return this.spellcastModifierTrait?.value ?? 0;
    }

    get spellcastingModifiers() {
        return {
            main: this.class.subclass?.system?.spellcastingTrait,
            multiclass: this.multiclass.subclass?.system?.spellcastingTrait
        };
    }

    get domains() {
        const classDomains = this.class.value ? this.class.value.system.domains : [];
        const multiclassDomains = this.multiclass.value ? this.multiclass.value.system.domains : [];
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

    get loadoutSlot() {
        const loadoutCount = this.domainCards.loadout?.length ?? 0,
            worldSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxLoadout,
            max = !worldSetting ? null : worldSetting + this.bonuses.maxLoadout;

        return {
            current: loadoutCount,
            available: !max ? true : Math.max(max - loadoutCount, 0),
            max
        };
    }

    get armor() {
        return this.parent.items.find(x => x.type === 'armor' && x.system.equipped);
    }

    get activeBeastform() {
        return this.parent.effects.find(x => x.type === 'beastform');
    }

    get usedUnarmed() {
        const primaryWeaponEquipped = this.primaryWeapon?.system?.equipped;
        const secondaryWeaponEquipped = this.secondaryWeapon?.system?.equipped;
        return !primaryWeaponEquipped && !secondaryWeaponEquipped
            ? {
                  ...this.attack,
                  uuid: this.attack.uuid,
                  id: this.attack.id,
                  name: this.activeBeastform ? 'DAGGERHEART.ITEMS.Beastform.attackName' : this.attack.name,
                  img: this.activeBeastform ? 'icons/creatures/claws/claw-straight-brown.webp' : this.attack.img,
                  actor: this.parent
              }
            : null;
    }

    get sheetLists() {
        const ancestryFeatures = [],
            communityFeatures = [],
            classFeatures = [],
            subclassFeatures = [],
            companionFeatures = [],
            features = [];

        for (let item of this.parent.items) {
            if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.ancestry.id) {
                ancestryFeatures.push(item);
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.community.id) {
                communityFeatures.push(item);
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.class.id) {
                classFeatures.push(item);
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.subclass.id) {
                if (this.class.subclass) {
                    const subclassState = this.class.subclass.system.featureState;
                    const subclass =
                        item.system.identifier === 'multiclass' ? this.multiclass.subclass : this.class.subclass;
                    const featureType = subclass
                        ? (subclass.system.features.find(x => x.item?.uuid === item.uuid)?.type ?? null)
                        : null;

                    if (
                        featureType === CONFIG.DH.ITEM.featureSubTypes.foundation ||
                        (featureType === CONFIG.DH.ITEM.featureSubTypes.specialization && subclassState >= 2) ||
                        (featureType === CONFIG.DH.ITEM.featureSubTypes.mastery && subclassState >= 3)
                    ) {
                        subclassFeatures.push(item);
                    }
                }
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.companion.id) {
                companionFeatures.push(item);
            } else if (item.type === 'feature' && !item.system.type) {
                features.push(item);
            }
        }

        return {
            ancestryFeatures: {
                title: `${game.i18n.localize('TYPES.Item.ancestry')} - ${this.ancestry?.name}`,
                type: 'ancestry',
                values: ancestryFeatures
            },
            communityFeatures: {
                title: `${game.i18n.localize('TYPES.Item.community')} - ${this.community?.name}`,
                type: 'community',
                values: communityFeatures
            },
            classFeatures: {
                title: `${game.i18n.localize('TYPES.Item.class')} - ${this.class.value?.name}`,
                type: 'class',
                values: classFeatures
            },
            subclassFeatures: {
                title: `${game.i18n.localize('TYPES.Item.subclass')} - ${this.class.subclass?.name}`,
                type: 'subclass',
                values: subclassFeatures
            },
            companionFeatures: {
                title: game.i18n.localize('DAGGERHEART.ACTORS.Character.companionFeatures'),
                type: 'companion',
                values: companionFeatures
            },
            features: { title: game.i18n.localize('DAGGERHEART.GENERAL.features'), type: 'feature', values: features }
        };
    }

    get primaryWeapon() {
        return this.parent.items.find(x => x.type === 'weapon' && x.system.equipped && !x.system.secondary);
    }

    get secondaryWeapon() {
        return this.parent.items.find(x => x.type === 'weapon' && x.system.equipped && x.system.secondary);
    }

    get getWeaponBurden() {
        return this.primaryWeapon?.system?.burden === burden.twoHanded.value ||
            (this.primaryWeapon && this.secondaryWeapon)
            ? burden.twoHanded.value
            : this.primaryWeapon || this.secondaryWeapon
              ? burden.oneHanded.value
              : null;
    }

    get deathMoveViable() {
        return this.resources.hitPoints.max > 0 && this.resources.hitPoints.value >= this.resources.hitPoints.max;
    }

    get armorApplicableDamageTypes() {
        return {
            physical: !this.rules.damageReduction.magical,
            magical: !this.rules.damageReduction.physical
        };
    }

    get basicAttackDamageDice() {
        const diceTypes = Object.keys(CONFIG.DH.GENERAL.diceTypes);
        const attackDiceIndex = Math.max(Math.min(this.rules.attack.damage.diceIndex, 5), 0);
        return diceTypes[attackDiceIndex];
    }

    static async unequipBeforeEquip(itemToEquip) {
        const primary = this.primaryWeapon,
            secondary = this.secondaryWeapon;
        if (itemToEquip.system.secondary) {
            if (primary && primary.burden === CONFIG.DH.GENERAL.burden.twoHanded.value) {
                await primary.update({ 'system.equipped': false });
            }

            if (secondary) {
                await secondary.update({ 'system.equipped': false });
            }
        } else {
            if (secondary && itemToEquip.system.burden === CONFIG.DH.GENERAL.burden.twoHanded.value) {
                await secondary.update({ 'system.equipped': false });
            }

            if (primary) {
                await primary.update({ 'system.equipped': false });
            }
        }
    }

    prepareBaseData() {
        this.evasion += this.class.value?.system?.evasion ?? 0;

        const currentLevel = this.levelData.level.current;
        const currentTier =
            currentLevel === 1
                ? null
                : Object.values(game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers).find(
                      tier => currentLevel >= tier.levels.start && currentLevel <= tier.levels.end
                  ).tier;
        if (game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).levelupAuto) {
            for (let levelKey in this.levelData.levelups) {
                const level = this.levelData.levelups[levelKey];

                this.proficiency += level.achievements.proficiency;

                for (let selection of level.selections) {
                    switch (selection.type) {
                        case 'trait':
                            selection.data.forEach(data => {
                                this.traits[data].value += 1;
                                this.traits[data].tierMarked = selection.tier === currentTier;
                            });
                            break;
                        case 'hitPoint':
                            this.resources.hitPoints.max += selection.value;
                            break;
                        case 'stress':
                            this.resources.stress.max += selection.value;
                            break;
                        case 'evasion':
                            this.evasion += selection.value;
                            break;
                        case 'proficiency':
                            this.proficiency += selection.value;
                            break;
                        case 'experience':
                            selection.data.forEach(id => {
                                const experience = this.experiences[id];
                                if (experience) experience.value += selection.value;
                            });
                            break;
                    }
                }
            }
        }

        const armor = this.armor;
        this.armorScore = armor ? armor.system.baseScore : 0;
        this.damageThresholds = {
            major: armor
                ? armor.system.baseThresholds.major + this.levelData.level.current
                : this.levelData.level.current,
            severe: armor
                ? armor.system.baseThresholds.severe + this.levelData.level.current
                : this.levelData.level.current * 2
        };
        this.resources.hope.max -= Object.keys(this.scars).length;
        this.resources.hitPoints.max += this.class.value?.system?.hitPoints ?? 0;
    }

    prepareDerivedData() {
        const baseHope = this.resources.hope.value + (this.companion?.system?.resources?.hope ?? 0);
        this.resources.hope.value = Math.min(baseHope, this.resources.hope.max);
        this.attack.roll.trait = this.rules.attack.roll.trait ?? this.attack.roll.trait;

        this.resources.armor = {
            value: this.armor?.system?.marks?.value ?? 0,
            max: this.armorScore,
            isReversed: true
        };

        this.attack.damage.parts[0].value.custom.formula = `@prof${this.basicAttackDamageDice}${this.rules.attack.damage.bonus ? ` + ${this.rules.attack.damage.bonus}` : ''}`;
    }

    getRollData() {
        const data = super.getRollData();

        return {
            ...data,
            basicAttackDamageDice: this.basicAttackDamageDice,
            tier: this.tier,
            level: this.levelData.level.current
        };
    }

    async _preDelete() {
        if (this.companion) {
            this.companion.updateLevel(1);
        }
    }
}
