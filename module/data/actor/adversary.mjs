import DHAdversarySettings from '../../applications/sheets-configs/adversary-settings.mjs';
import { ActionField } from '../fields/actionField.mjs';
import { commonActorRules } from './base.mjs';
import DhCreature from './creature.mjs';
import { bonusField } from '../fields/actorField.mjs';
import { getTierAdjustedAdversary } from './tierAdjustment.mjs';
import { signedNumber } from '../../helpers/utils.mjs';

export default class DhpAdversary extends DhCreature {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Adversary'];

    static embedTemplate = 'systems/daggerheart/templates/components/actor-embed/adversary.hbs';

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.adversary',
            type: 'adversary',
            settingSheet: DHAdversarySettings,
            hasAttribution: true,
            usesSize: true
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({
                required: true,
                integer: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers[1].id
            }),
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.ACTOR.allAdversaryTypes,
                initial: CONFIG.DH.ACTOR.adversaryTypes.standard.id
            }),
            typeData: new fields.TypedSchemaField(CONFIG.DH.ACTOR.adversaryTypeModels, 
                { nullable: true, initial: null }
            ),
            motivesAndTactics: new fields.StringField(),
            notes: new fields.HTMLField(),
            difficulty: new fields.NumberField({ required: true, initial: 1, integer: true }),
            criticalThreshold: new fields.NumberField({
                required: true,
                integer: true,
                min: 1,
                max: 20,
                initial: 20,
                label: 'DAGGERHEART.ACTIONS.Settings.criticalThreshold'
            }),
            damageThresholds: new fields.SchemaField({
                major: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.majorThreshold'
                }),
                severe: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.severeThreshold'
                })
            }),
            rules: new fields.SchemaField({
                ...commonActorRules()
            }, { persisted: false }),
            attack: new ActionField({
                nullable: true,
                initial: {
                    name: 'Attack',
                    img: 'icons/skills/melee/blood-slash-foam-red.webp',
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
                        type: 'attack'
                    },
                    damage: {
                        main: {
                            type: ['physical'],
                            applyTo: 'hitPoints',
                            value: {
                                multiplier: 'flat'
                            }
                        }
                    }
                }
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    value: new fields.NumberField({ required: true, integer: true, initial: 1 }),
                    description: new fields.StringField()
                })
            ),
            bonuses: new fields.SchemaField({
                roll: bonusField('DAGGERHEART.GENERAL.roll'),
                damage: bonusField('DAGGERHEART.GENERAL.damage')
            }, { persisted: false })
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/dragon-head.svg';

    /* -------------------------------------------- */

    get attackBonus() {
        return this.attack?.roll.bonus ?? null;
    }

    get attackDamageType() {
        const type = this.attack?.damage.main.type.first();
        return type ? _loc(CONFIG.DH.GENERAL.damageTypes[type].lowercase) : '<No Damage Type>';
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }

    isItemValid(source) {
        return super.isItemValid(source) || source.type === 'feature';
    }

    _getTags() {
        const tags = [
            game.i18n.localize(`DAGGERHEART.GENERAL.Tiers.${this.tier}`),
            `${game.i18n.localize(`DAGGERHEART.CONFIG.AdversaryType.${this.type}.label`)}`,
            `${game.i18n.localize('DAGGERHEART.GENERAL.difficulty')}: ${this.difficulty}`
        ];
        return tags;
    }

    /** Returns source data for this actor adjusted to a new tier, which can be used to create a new actor. */
    adjustForTier(tier) {
        const source = this.parent.toObject(true);
        return getTierAdjustedAdversary(source, tier);
    }

    /** @inheritdoc */
    async _prepareEmbedContext(options) {
        const adversaryTypes = CONFIG.DH.ACTOR.allAdversaryTypes();
        const attack = this.attack ? {
            name: this.attack.name,
            range: _loc(CONFIG.DH.GENERAL.range[this.attack.range]?.label),
            bonus: signedNumber(this.attack.roll?.bonus),
            damage: this.attack.getDamageFormula()
        } : null;

        return {
            ...(await super._prepareEmbedContext(options)),
            actor: this.parent,
            type: _loc(adversaryTypes[this.type]?.label),
            attack,
            experiences: Object.values(this.experiences).map(e => ({ name: e.name, value: signedNumber(e.value) }))
        }
    }

    /* -------------------------------------------- */
    /*  Data Preparation                            */
    /* -------------------------------------------- */

    /** @inheritdoc */
    prepareBaseData() {
        super.prepareBaseData();
        if (this.attack) {
            this.attack.roll.isStandardAttack = true;
        }

        // Ensure type data exists in case it got somehow removed (ex: modules).
        // Updating the source allows updates not to break when we add the prepared data
        const typeModel = CONFIG.DH.ACTOR.adversaryTypeModels[this.type];
        if (typeModel && !this.typeData) {
            this.typeData = new typeModel();
            this.updateSource({ typeData: this.typeData.toObject() });
        }

        if (this.type === 'horde') {
            // Add backwards compatibility. Consider a deprecation warning at a later date
            Object.defineProperty(this.attack, 'altDamageFormula', {
                get: () => {
                    return Roll.replaceFormulaData(this.typeData.hordeDamage, this.getRollData());
                }
            })
        }
    }

    /** @inheritdoc */
    prepareDerivedData() {
        super.prepareDerivedData();

        // Evolution features may set other features as inactive
        for (const feature of this.features.filter(x => x.system.featureForm === 'evolution')) {
            const evolutionActions = feature.system.actions.filter(x => x.type === 'evolution');
            for (const action of evolutionActions) {
                const evolutionActive = action.evolution.active;
                for (const [id, state] of Object.entries(action.evolution.evolutionFeatures)) {
                    const isEvolvedFeature = state === CONFIG.DH.ACTIONS.evolutionStates.evolved.id;
                    const isUnevolvedFeature = state === CONFIG.DH.ACTIONS.evolutionStates.unevolved.id;
                    const feature = this.parent.items.get(id);
                    feature.system.inactive = 
                        (isEvolvedFeature && !evolutionActive) || (isUnevolvedFeature && evolutionActive);
                }
            }
        }

        // Clamp resources (must be done last to ensure all updates occur)
        this.clampResources();
    }

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    /** @inheritdoc */
    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system?.type && changes.system.type !== this.type) {
            const newType = CONFIG.DH.ACTOR.adversaryTypeModels[changes.system.type] ?? null;
            const newTypeData = newType ? (new newType()).toObject() : null;
            changes.system.typeData = newTypeData;
        }
    }

    /** @inheritdoc */
    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        if (game.user.id === userId && changes.system?.type && !options?.isRefresh) {
            const existingHordeFeature = 
                this.parent.items.find(x => x.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.actorFlags.hordeFeature));
            if (changes.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
                if (!existingHordeFeature) {
                    const hordeEffectData = {
                        name: _loc('DAGGERHEART.CONFIG.AdversaryType.horde.label'),
                        img: 'icons/magic/movement/chevrons-down-yellow.webp',
                        showIcon: 2,
                        system: {
                            conditionals: [{
                                type: 'dataCompare',
                                key: 'system.resources.hitPoints.value',
                                comparator: 'greaterEquals',
                                value: '@system.resources.hitPoints.max / 2'
                            }],
                            changes: [{
                                type: 'standardAttack',
                                value: {
                                    name: '',
                                    damageTypes: [],
                                    attackRange: null,
                                    trait: null,
                                    damageFormula: '@system.typeData.hordeDamage',
                                    img: null
                                },
                                priority: 0
                            }]
                        }
                    };
                    this.parent.createEmbeddedDocuments('Item', [{
                        type: 'feature',
                        featureForm: CONFIG.DH.ITEM.featureForm.passive,
                        name: _loc('DAGGERHEART.CONFIG.AdversaryType.horde.label'),
                        img: 'icons/creatures/magical/humanoid-silhouette-aliens-green.webp',
                        system: {
                            description: `When the @Lookup[@name] have marked half or more of their HP, their standard attack deals @Lookup[@system.typeData.hordeDamage] @Lookup[@system.attackDamageType] damage instead.`
                        },
                        flags: { [CONFIG.DH.id]: { [CONFIG.DH.FLAGS.actorFlags.hordeFeature]: true } },
                        effects: [hordeEffectData]
                    }]);
                }
            } else {
                existingHordeFeature?.delete();
            }
        }
    }
}
