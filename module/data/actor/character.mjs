import { burden } from '../../config/generalConfig.mjs';
import ActionField from '../fields/actionField.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import DhLevelData from '../levelData.mjs';
import BaseDataActor from './base.mjs';

const attributeField = () =>
    new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({ initial: null, integer: true }),
        bonus: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        tierMarked: new foundry.data.fields.BooleanField({ initial: false })
    });

const resourceField = max =>
    new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        bonus: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        max: new foundry.data.fields.NumberField({ initial: max, integer: true })
    });

const stressDamageReductionRule = () =>
    new foundry.data.fields.SchemaField({
        enabled: new foundry.data.fields.BooleanField({ required: true, initial: false }),
        cost: new foundry.data.fields.NumberField({ integer: true })
    });

export default class DhCharacter extends BaseDataActor {
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.character',
            type: 'character'
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            resources: new fields.SchemaField({
                hitPoints: new fields.SchemaField({
                    value: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
                    bonus: new foundry.data.fields.NumberField({ initial: 0, integer: true })
                }),
                stress: resourceField(6),
                hope: resourceField(6),
                tokens: new fields.ObjectField(),
                dice: new fields.ObjectField()
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
                value: new fields.NumberField({ initial: 1, integer: true }),
                bonus: new fields.NumberField({ initial: 0, integer: true })
            }),
            evasion: new fields.SchemaField({
                bonus: new fields.NumberField({ initial: 0, integer: true })
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    value: new fields.NumberField({ integer: true, initial: 0 }),
                    bonus: new fields.NumberField({ integer: true, initial: 0 })
                })
            ),
            gold: new fields.SchemaField({
                coins: new fields.NumberField({ initial: 0, integer: true }),
                handfulls: new fields.NumberField({ initial: 0, integer: true }),
                bags: new fields.NumberField({ initial: 0, integer: true }),
                chests: new fields.NumberField({ initial: 0, integer: true })
            }),
            scars: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    description: new fields.HTMLField()
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
            actions: new fields.ArrayField(new ActionField()),
            levelData: new fields.EmbeddedDataField(DhLevelData),
            bonuses: new fields.SchemaField({
                armorScore: new fields.NumberField({ integer: true, initial: 0 }),
                damageThresholds: new fields.SchemaField({
                    severe: new fields.NumberField({ integer: true, initial: 0 }),
                    major: new fields.NumberField({ integer: true, initial: 0 })
                }),
                roll: new fields.SchemaField({
                    attack: new fields.NumberField({ integer: true, initial: 0 }),
                    spellcast: new fields.NumberField({ integer: true, initial: 0 }),
                    action: new fields.NumberField({ integer: true, initial: 0 }),
                    hopeOrFear: new fields.NumberField({ integer: true, initial: 0 })
                }),
                damage: new fields.SchemaField({
                    all: new fields.NumberField({ integer: true, initial: 0 }),
                    physical: new fields.NumberField({ integer: true, initial: 0 }),
                    magic: new fields.NumberField({ integer: true, initial: 0 })
                })
            }),
            companion: new ForeignDocumentUUIDField({ type: 'Actor', nullable: true, initial: null }),
            rules: new fields.SchemaField({
                maxArmorMarked: new fields.SchemaField({
                    value: new fields.NumberField({ required: true, integer: true, initial: 1 }),
                    bonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
                    stressExtra: new fields.NumberField({ required: true, integer: true, initial: 0 })
                }),
                stressDamageReduction: new fields.SchemaField({
                    severe: stressDamageReductionRule(),
                    major: stressDamageReductionRule(),
                    minor: stressDamageReductionRule()
                }),
                strangePatterns: new fields.NumberField({
                    integer: true,
                    min: 1,
                    max: 12,
                    nullable: true,
                    initial: null
                }),
                runeWard: new fields.BooleanField({ initial: false })
            })
        };
    }

    get tier() {
        return this.levelData.level.current === 1
            ? 1
            : Object.values(game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers).tiers).find(
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
        return !this.class.value || !this.class.subclass;
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

    get armor() {
        return this.parent.items.find(x => x.type === 'armor' && x.system.equipped);
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
        return (
            this.resources.hitPoints.maxTotal > 0 && this.resources.hitPoints.value >= this.resources.hitPoints.maxTotal
        );
    }

    static async unequipBeforeEquip(itemToEquip) {
        const primary = this.primaryWeapon,
            secondary = this.secondaryWeapon;
        if (itemToEquip.system.secondary) {
            if (primary && primary.burden === SYSTEM.GENERAL.burden.twoHanded.value) {
                await primary.update({ 'system.equipped': false });
            }

            if (secondary) {
                await secondary.update({ 'system.equipped': false });
            }
        } else {
            if (secondary && itemToEquip.system.burden === SYSTEM.GENERAL.burden.twoHanded.value) {
                await secondary.update({ 'system.equipped': false });
            }

            if (primary) {
                await primary.update({ 'system.equipped': false });
            }
        }
    }

    prepareBaseData() {
        const currentLevel = this.levelData.level.current;
        const currentTier =
            currentLevel === 1
                ? null
                : Object.values(game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers).tiers).find(
                      tier => currentLevel >= tier.levels.start && currentLevel <= tier.levels.end
                  ).tier;
        for (let levelKey in this.levelData.levelups) {
            const level = this.levelData.levelups[levelKey];

            this.proficiency.bonus += level.achievements.proficiency;

            for (let selection of level.selections) {
                switch (selection.type) {
                    case 'trait':
                        selection.data.forEach(data => {
                            this.traits[data].bonus += 1;
                            this.traits[data].tierMarked = selection.tier === currentTier;
                        });
                        break;
                    case 'hitPoint':
                        this.resources.hitPoints.bonus += selection.value;
                        break;
                    case 'stress':
                        this.resources.stress.bonus += selection.value;
                        break;
                    case 'evasion':
                        this.evasion.bonus += selection.value;
                        break;
                    case 'proficiency':
                        this.proficiency.bonus = selection.value;
                        break;
                    case 'experience':
                        Object.keys(this.experiences).forEach(key => {
                            const experience = this.experiences[key];
                            experience.bonus += selection.value;
                        });
                        break;
                }
            }
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
    }

    prepareDerivedData() {
        this.resources.hope.max -= Object.keys(this.scars).length;
        this.resources.hope.value = Math.min(this.resources.hope.value, this.resources.hope.max);

        for (var traitKey in this.traits) {
            var trait = this.traits[traitKey];
            trait.total = (trait.value ?? 0) + trait.bonus;
        }

        for (var experienceKey in this.experiences) {
            var experience = this.experiences[experienceKey];
            experience.total = experience.value + experience.bonus;
        }

        this.rules.maxArmorMarked.total = this.rules.maxArmorMarked.value + this.rules.maxArmorMarked.bonus;

        this.armorScore = this.armor ? this.armor.system.baseScore + (this.bonuses.armorScore ?? 0) : 0;
        this.resources.hitPoints.maxTotal = (this.class.value?.system?.hitPoints ?? 0) + this.resources.hitPoints.bonus;
        this.resources.stress.maxTotal = this.resources.stress.max + this.resources.stress.bonus;
        this.evasion.total = (this.class?.evasion ?? 0) + this.evasion.bonus;
        this.proficiency.total = this.proficiency.value + this.proficiency.bonus;
    }

    getRollData() {
        const data = super.getRollData();
        return {
            ...data,
            ...this.resources.tokens,
            ...this.resources.dice,
            ...this.bonuses,
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
