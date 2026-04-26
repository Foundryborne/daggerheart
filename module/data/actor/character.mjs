import { burden } from '../../config/generalConfig.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import DhLevelData from '../levelData.mjs';
import { commonActorRules } from './base.mjs';
import DhCreature from './creature.mjs';
import { attributeField, stressDamageReductionRule, bonusField, GoldField } from '../fields/actorField.mjs';
import { ActionField } from '../fields/actionField.mjs';
import DHCharacterSettings from '../../applications/sheets-configs/character-settings.mjs';
import { getArmorSources } from '../../helpers/utils.mjs';

export default class DhCharacter extends DhCreature {
    /**@override */
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Character'];

    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.character',
            type: 'character',
            settingSheet: DHCharacterSettings,
            isNPC: false,
            hasInventory: true,
            quantifiable: ['loot', 'consumable']
        });
    }

    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
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
            damageThresholds: new fields.SchemaField({
                major: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.majorThreshold'
                }),
                severe: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.severeThreshold'
                })
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    value: new fields.NumberField({ integer: true, initial: 0 }),
                    description: new fields.StringField(),
                    core: new fields.BooleanField({ initial: false })
                })
            ),
            gold: new GoldField(),
            scars: new fields.NumberField({ initial: 0, integer: true, label: 'DAGGERHEART.GENERAL.scars' }),
            biography: new fields.SchemaField({
                background: new fields.HTMLField(),
                connections: new fields.HTMLField(),
                characteristics: new fields.SchemaField({
                    pronouns: new fields.StringField({}),
                    age: new fields.StringField({}),
                    faith: new fields.StringField({})
                })
            }),
            attack: new ActionField({
                initial: {
                    name: 'DAGGERHEART.GENERAL.unarmedAttack',
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
                        parts: {
                            hitPoints: {
                                type: ['physical'],
                                value: {
                                    custom: {
                                        enabled: true,
                                        formula: '@profd4'
                                    }
                                }
                            }
                        }
                    }
                }
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
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.shortRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.shortRestMoves.hint'
                        }),
                        longMoves: new fields.NumberField({
                            required: true,
                            integer: true,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.longRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.shortRest.longRestMoves.hint'
                        })
                    }),
                    longRest: new fields.SchemaField({
                        shortMoves: new fields.NumberField({
                            required: true,
                            integer: true,
                            initial: 0,
                            label: 'DAGGERHEART.GENERAL.Bonuses.rest.longRest.shortRestMoves.label',
                            hint: 'DAGGERHEART.GENERAL.Bonuses.rest.longRest.shortRestMoves.hint'
                        }),
                        longMoves: new fields.NumberField({
                            required: true,
                            integer: true,
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
                ...commonActorRules({
                    damageReduction: {
                        magical: new fields.BooleanField({
                            initial: false,
                            label: 'DAGGERHEART.GENERAL.Rules.damageReduction.magical.label',
                            hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.magical.hint'
                        }),
                        physical: new fields.BooleanField({
                            initial: false,
                            label: 'DAGGERHEART.GENERAL.Rules.damageReduction.physical.label',
                            hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.physical.hint'
                        }),
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
                            severe: stressDamageReductionRule(
                                'DAGGERHEART.GENERAL.Rules.damageReduction.stress.severe'
                            ),
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
                        disabledArmor: new fields.BooleanField({
                            intial: false,
                            label: 'DAGGERHEART.GENERAL.Rules.damageReduction.disabledArmor.label'
                        })
                    },
                    attack: {
                        damage: {
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
                        },
                        roll: new fields.SchemaField({
                            trait: new fields.StringField({
                                required: true,
                                choices: CONFIG.DH.ACTOR.abilities,
                                nullable: true,
                                initial: null,
                                label: 'DAGGERHEART.GENERAL.Rules.attack.roll.trait.label'
                            })
                        })
                    }
                }),
                dualityRoll: new fields.SchemaField({
                    defaultHopeDice: new fields.NumberField({
                        nullable: false,
                        required: true,
                        integer: true,
                        choices: CONFIG.DH.GENERAL.dieFaces,
                        initial: 12,
                        label: 'DAGGERHEART.ACTORS.Character.defaultHopeDice'
                    }),
                    defaultFearDice: new fields.NumberField({
                        nullable: false,
                        required: true,
                        integer: true,
                        choices: CONFIG.DH.GENERAL.dieFaces,
                        initial: 12,
                        label: 'DAGGERHEART.ACTORS.Character.defaultFearDice'
                    })
                }),
                burden: new fields.SchemaField({
                    ignore: new fields.BooleanField({ label: 'DAGGERHEART.ACTORS.Character.burden.ignore.label' })
                }),
                roll: new fields.SchemaField({
                    guaranteedCritical: new fields.BooleanField({
                        label: 'DAGGERHEART.ACTORS.Character.roll.guaranteedCritical.label',
                        hint: 'DAGGERHEART.ACTORS.Character.roll.guaranteedCritical.hint'
                    }),
                    defaultAdvantageDice: new fields.NumberField({
                        nullable: true,
                        required: true,
                        integer: true,
                        choices: CONFIG.DH.GENERAL.dieFaces,
                        initial: null,
                        label: 'DAGGERHEART.ACTORS.Character.defaultAdvantageDice'
                    }),
                    defaultDisadvantageDice: new fields.NumberField({
                        nullable: true,
                        required: true,
                        integer: true,
                        choices: CONFIG.DH.GENERAL.dieFaces,
                        initial: null,
                        label: 'DAGGERHEART.ACTORS.Character.defaultDisadvantageDice'
                    })
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

    get class() {
        const value = this.parent.items.find(x => x.type === 'class' && !x.system.isMulticlass);
        const subclass = this.parent.items.find(x => x.type === 'subclass' && !x.system.isMulticlass);

        return {
            value,
            subclass
        };
    }

    get multiclass() {
        const value = this.parent.items.find(x => x.type === 'class' && x.system.isMulticlass);
        const subclass = this.parent.items.find(x => x.type === 'subclass' && x.system.isMulticlass);

        return {
            value,
            subclass
        };
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature') ?? [];
    }

    get companionFeatures() {
        return this.companion ? this.companion.items.filter(x => x.type === 'feature') : [];
    }

    get needsCharacterSetup() {
        const { value: classValue, subclass } = this.class;
        return !(classValue || subclass || this.ancestry || this.community);
    }

    get spellcastModifierTrait() {
        const subClasses = this.parent.items.filter(x => x.type === 'subclass') ?? [];
        const modifiers = subClasses
            ?.map(sc => ({ ...this.traits[sc.system.spellcastingTrait], key: sc.system.spellcastingTrait }))
            .filter(x => x);
        return modifiers.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
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
        const multiclass = this.multiclass.value;
        const multiclassDomains = multiclass ? multiclass.system.domains : [];
        return [...classDomains, ...multiclassDomains];
    }

    get domainData() {
        const allDomainData = CONFIG.DH.DOMAIN.allDomains();
        return this.domains.map(key => {
            const domain = allDomainData[key];
            return {
                id: key,
                ...domain,
                label: game.i18n.localize(domain?.label) ?? key
            };
        });
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
        const loadoutCount = this.domainCards.loadout?.length ?? 0;
        const worldSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxLoadout;
        return {
            current: loadoutCount,
            available: loadoutCount < worldSetting
        };
    }

    get armor() {
        return this.parent.items.find(x => x.type === 'armor' && x.system.equipped);
    }

    get activeBeastform() {
        return this.parent.effects.find(x => x.type === 'beastform');
    }

    /**
     * Gets the unarmed attackwhen no primary or secondary weapon is equipped.
     * Returns `null` if either weapon is equipped.
     * If the actor is in beastform, overrides the attack's name and image.
     *
     * @returns {DHAttackAction|null}
     */
    get usedUnarmed() {
        if (this.primaryWeapon?.system?.equipped || this.secondaryWeapon?.system?.equipped) return null;

        const attack = foundry.utils.deepClone(this.attack);
        if (this.activeBeastform) {
            attack.name = 'DAGGERHEART.ITEMS.Beastform.attackName';
            attack.img = 'icons/creatures/claws/claw-straight-brown.webp';
        }
        return attack;
    }

    /* All items are valid on characters */
    isItemValid() {
        return true;
    }

    /** @inheritDoc */
    isItemAvailable(item) {
        if (!super.isItemAvailable(this)) return false;
        /**
         * Preventing subclass features from being available if the chacaracter does not
         * have the right subclass advancement
         */
        if (item.system.originItemType !== CONFIG.DH.ITEM.featureTypes.subclass.id) {
            return true;
        }
        if (!this.class.subclass) return false;

        const prop = item.system.multiclassOrigin ? 'multiclass' : 'class';
        const subclassState = this[prop].subclass?.system?.featureState;
        if (!subclassState) return false;

        if (
            item.system.identifier === CONFIG.DH.ITEM.featureSubTypes.foundation ||
            (item.system.identifier === CONFIG.DH.ITEM.featureSubTypes.specialization && subclassState >= 2) ||
            (item.system.identifier === CONFIG.DH.ITEM.featureSubTypes.mastery && subclassState >= 3)
        ) {
            return true;
        } else {
            return false;
        }
    }

    async updateArmorValue({ value: armorChange = 0, clear = false }) {
        if (armorChange === 0 && !clear) return;

        const increasing = armorChange >= 0;
        let remainingChange = Math.abs(armorChange);
        const orderedSources = getArmorSources(this.parent).filter(s => !s.disabled);

        const handleArmorData = (embeddedUpdates, doc, armorData) => {
            let usedArmorChange = 0;
            if (clear) {
                usedArmorChange -= armorData.current;
            } else {
                if (increasing) {
                    const remainingArmor = armorData.max - armorData.current;
                    usedArmorChange = Math.min(remainingChange, remainingArmor);
                    remainingChange -= usedArmorChange;
                } else {
                    const changeChange = Math.min(armorData.current, remainingChange);
                    usedArmorChange -= changeChange;
                    remainingChange -= changeChange;
                }
            }

            if (!usedArmorChange) return usedArmorChange;
            else {
                if (!embeddedUpdates[doc.id]) embeddedUpdates[doc.id] = { doc: doc, updates: [] };

                return usedArmorChange;
            }
        };

        const armorUpdates = [];
        const effectUpdates = [];
        for (const { document: armorSource } of orderedSources) {
            const usedArmorChange = handleArmorData(
                armorSource.type === 'armor' ? armorUpdates : effectUpdates,
                armorSource.parent,
                armorSource.type === 'armor' ? armorSource.system.armor : armorSource.system.armorData
            );
            if (!usedArmorChange) continue;

            if (armorSource.type === 'armor') {
                armorUpdates[armorSource.parent.id].updates.push({
                    '_id': armorSource.id,
                    'system.armor.current': armorSource.system.armor.current + usedArmorChange
                });
            } else {
                effectUpdates[armorSource.parent.id].updates.push({
                    '_id': armorSource.id,
                    'system.changes': armorSource.system.changes.map(change => ({
                        ...change,
                        value:
                            change.type === 'armor'
                                ? {
                                      ...change.value,
                                      current: armorSource.system.armorChange.value.current + usedArmorChange
                                  }
                                : change.value
                    }))
                });
            }

            if (remainingChange === 0 && !clear) break;
        }

        const armorUpdateValues = Object.values(armorUpdates);
        for (const [index, { doc, updates }] of armorUpdateValues.entries())
            await doc.updateEmbeddedDocuments('Item', updates, { render: index === armorUpdateValues.length - 1 });

        const effectUpdateValues = Object.values(effectUpdates);
        for (const [index, { doc, updates }] of effectUpdateValues.entries())
            await doc.updateEmbeddedDocuments('ActiveEffect', updates, {
                render: index === effectUpdateValues.length - 1
            });
    }

    async updateArmorEffectValue({ uuid, value }) {
        const source = await foundry.utils.fromUuid(uuid);
        if (source.type === 'armor') {
            await source.update({
                'system.armor.current': source.system.armor.current + value
            });
        } else {
            const effectValue = source.system.armorChange.value;
            await source.update({
                'system.changes': [
                    {
                        ...source.system.armorChange,
                        value: { ...effectValue, current: effectValue.current + value }
                    }
                ]
            });
        }
    }

    get sheetLists() {
        const ancestryFeatures = [],
            communityFeatures = [],
            classFeatures = [],
            subclassFeatures = [],
            companionFeatures = [],
            features = [];

        for (let item of this.parent.items.filter(x => this.isItemAvailable(x))) {
            if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.ancestry.id) {
                ancestryFeatures.push(item);
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.community.id) {
                communityFeatures.push(item);
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.class.id) {
                classFeatures.push(item);
            } else if (item.system.originItemType === CONFIG.DH.ITEM.featureTypes.subclass.id) {
                subclassFeatures.push(item);
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
        const { characterDefault } = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.Automation
        ).defeated;
        const deathMoveOutcomeStatuses = Object.keys(CONFIG.DH.GENERAL.defeatedConditionChoices).filter(
            key => key !== characterDefault
        );
        const deathMoveNotResolved = this.parent.statuses.every(status => !deathMoveOutcomeStatuses.includes(status));

        const allHitPointsMarked =
            this.resources.hitPoints.max > 0 && this.resources.hitPoints.value >= this.resources.hitPoints.max;
        return deathMoveNotResolved && allHitPointsMarked;
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
        super.prepareBaseData();
        this.armorScore = {
            max: this.armor?.system.armor.max ?? 0,
            value: this.armor?.system.armor.current ?? 0
        };
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
                                if (experience) {
                                    experience.value += selection.value;
                                    experience.leveledUp = true;
                                }
                            });
                            break;
                    }
                }
            }
        }

        /* Armor and ArmorEffects can set a Base Damage Threshold. Characters only gain level*2 bonus to severe if this is not present */
        const severeThresholdMulitplier =
            this.armor ||
            this.parent.appliedEffects.some(x =>
                x.system.changes.some(x => x.type === 'armor' && x.value.damageThresholds)
            )
                ? 1
                : 2;

        this.damageThresholds = {
            major: this.armor
                ? this.armor.system.baseThresholds.major + this.levelData.level.current
                : this.levelData.level.current,
            severe: this.armor
                ? this.armor.system.baseThresholds.severe + this.levelData.level.current
                : this.levelData.level.current * severeThresholdMulitplier
        };

        const globalHopeMax = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxHope;
        this.resources.hope.max = globalHopeMax;
        this.resources.hitPoints.max += this.class.value?.system?.hitPoints ?? 0;

        /* Companion Related Data */
        this.companionData = {
            levelupChoices: this.levelData.level.current - 1
        };
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        this.resources.hope.max -= this.scars;
        if (this.companion) {
            for (let levelKey in this.companion.system.levelData.levelups) {
                const level = this.companion.system.levelData.levelups[levelKey];
                for (let selection of level.selections) {
                    switch (selection.type) {
                        case 'hope':
                            this.resources.hope.max += selection.value;
                            break;
                    }
                }
            }
        }

        this.attack.roll.trait = this.rules.attack.roll.trait ?? this.attack.roll.trait;

        this.resources.armor = {
            ...this.armorScore,
            label: 'DAGGERHEART.GENERAL.armor',
            isReversed: true
        };

        this.attack.damage.parts.hitPoints.value.custom.formula = `@prof${this.basicAttackDamageDice}${this.rules.attack.damage.bonus ? ` + ${this.rules.attack.damage.bonus}` : ''}`;

        // Clamp resources (must be done last to ensure all updates occur)
        this.resources.clamp();
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

    async _preUpdate(changes, options, userId) {
        const allowed = await super._preUpdate(changes, options, userId);
        if (allowed === false) return;

        /* The first two experiences are always marked as core */
        if (changes.system?.experiences && Object.keys(this.experiences).length < 2) {
            const experiences = new Set(Object.keys(this.experiences));
            const changeExperiences = new Set(Object.keys(changes.system.experiences));
            const newExperiences = Array.from(changeExperiences.difference(experiences));

            for (var i = 0; i < Math.min(newExperiences.length, 2 - experiences.size); i++) {
                const experience = newExperiences[i];
                changes.system.experiences[experience].core = true;
            }
        }

        /* Scars can alter the amount of current hope */
        if (changes.system?.scars) {
            const diff = this.system.scars - changes.system.scars;
            const newHopeMax = this.system.resources.hope.max + diff;
            const newHopeValue = Math.min(newHopeMax, this.system.resources.hope.value);
            if (newHopeValue != this.system.resources.hope.value) {
                if (!changes.system.resources.hope) changes.system.resources.hope = { value: 0 };

                changes.system.resources.hope = {
                    ...changes.system.resources.hope,
                    value: changes.system.resources.hope.value + newHopeValue
                };
            }
        }

        /* Force companion data prep */
        if (this.companion) {
            if (
                changes.system?.levelData?.level?.current !== undefined &&
                changes.system.levelData.level.current !== this._source.levelData.level.current
            ) {
                this.companion.update(this.companion.toObject(), { diff: false, recursive: false });
            }
        }
    }

    async _preDelete() {
        super._preDelete();

        if (this.companion) {
            this.companion.updateLevel(1);
        }
    }

    _getTags() {
        return [this.class.value?.name, this.class.subclass?.name, this.community?.name, this.ancestry?.name].filter(
            t => !!t
        );
    }

    static migrateData(source) {
        if (typeof source.scars === 'object') source.scars = 0;

        return super.migrateData(source);
    }
}
