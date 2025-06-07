import { burden } from '../config/generalConfig.mjs';
import ForeignDocumentUUIDField from './fields/foreignDocumentUUIDField.mjs';
import { LevelOptionType } from './levelTier.mjs';

const attributeField = () =>
    new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        tierMarked: new foundry.data.fields.BooleanField({ initial: false })
    });

const resourceField = max =>
    new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        max: new foundry.data.fields.NumberField({ initial: max, integer: true })
    });

export default class DhCharacter extends foundry.abstract.TypeDataModel {
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
            proficiency: new fields.NumberField({ initial: 1, integer: true }),
            evasion: new fields.NumberField({ initial: 0, integer: true }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    description: new fields.StringField({}),
                    value: new fields.NumberField({ integer: true, nullable: true, initial: null })
                }),
                {
                    initial: {
                        [foundry.utils.randomID()]: { description: '', value: 2 },
                        [foundry.utils.randomID()]: { description: '', value: 2 }
                    }
                }
            ),
            gold: new fields.SchemaField({
                coins: new fields.NumberField({ initial: 0, integer: true }),
                handfulls: new fields.NumberField({ initial: 0, integer: true }),
                bags: new fields.NumberField({ initial: 0, integer: true }),
                chests: new fields.NumberField({ initial: 0, integer: true })
            }),
            pronouns: new fields.StringField({}),
            scars: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    description: new fields.HTMLField()
                })
            ),
            story: new fields.HTMLField(),
            description: new fields.HTMLField(),
            class: new fields.SchemaField({
                value: new ForeignDocumentUUIDField({ type: 'Item', nullable: true }),
                subclass: new ForeignDocumentUUIDField({ type: 'Item', nullable: true })
            }),
            multiclass: new fields.SchemaField({
                value: new ForeignDocumentUUIDField({ type: 'Item', nullable: true }),
                subclass: new ForeignDocumentUUIDField({ type: 'Item', nullable: true })
            }),
            levelData: new fields.EmbeddedDataField(DhPCLevelData)
        };
    }

    get ancestry() {
        return this.parent.items.find(x => x.type === 'ancestry') ?? null;
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
        for (var attributeKey in this.traits) {
            const attribute = this.traits[attributeKey];
            /* Levleup handling */
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
