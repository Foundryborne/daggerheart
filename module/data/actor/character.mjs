import { burden } from '../../config/generalConfig.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import { LevelOptionType } from '../levelTier.mjs';
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
                hitPoints: resourceField(6),
                stress: resourceField(6),
                hope: resourceField(6)
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
                    description: new fields.StringField({}),
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
            levelData: new fields.EmbeddedDataField(DhPCLevelData),
            bonuses: new fields.SchemaField({
                attack: new fields.NumberField({ integer: true, initial: 0 }),
                spellcast: new fields.NumberField({ integer: true, initial: 0 }),
                armorScore: new fields.NumberField({ integer: true, initial: 0 })
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

        this.resources.hitPoints.maxTotal = this.resources.hitPoints.max + this.resources.hitPoints.bonus;
        this.resources.stress.maxTotal = this.resources.stress.max + this.resources.stress.bonus;
        this.evasion.total = (this.class?.evasion ?? 0) + this.evasion.bonus;
        this.proficiency.total = this.proficiency.value + this.proficiency.bonus;
    }

    getRollData() {
        const data = super.getRollData();
        return {
            ...data,
            tier: this.tier
        };
    }
}

class DhPCLevelData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

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
                            secondaryData: new fields.TypedObjectField(new fields.StringField({ required: true })),
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
