import DHAdversarySettings from '../../applications/sheets-configs/adversary-settings.mjs';
import { ActionField } from '../fields/actionField.mjs';
import BaseDataActor from './base.mjs';
import { resourceField, bonusField } from '../fields/actorField.mjs';

export default class DhpAdversary extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Adversary'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.adversary',
            type: 'adversary',
            settingSheet: DHAdversarySettings,
            hasAttribution: true
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
                choices: CONFIG.DH.ACTOR.adversaryTypes,
                initial: CONFIG.DH.ACTOR.adversaryTypes.standard.id
            }),
            motivesAndTactics: new fields.StringField(),
            notes: new fields.HTMLField(),
            difficulty: new fields.NumberField({ required: true, initial: 1, integer: true }),
            hordeHp: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                label: 'DAGGERHEART.GENERAL.hordeHp'
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
            resources: new fields.SchemaField({
                hitPoints: resourceField(0, 0, 'DAGGERHEART.GENERAL.HitPoints.plural', true),
                stress: resourceField(0, 0, 'DAGGERHEART.GENERAL.stress', true)
            }),
            attack: new ActionField({
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
                        parts: [
                            {
                                type: ['physical'],
                                value: {
                                    multiplier: 'flat'
                                }
                            }
                        ]
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
                roll: new fields.SchemaField({
                    attack: bonusField('DAGGERHEART.GENERAL.Roll.attack'),
                    action: bonusField('DAGGERHEART.GENERAL.Roll.action'),
                    reaction: bonusField('DAGGERHEART.GENERAL.Roll.reaction')
                }),
                damage: new fields.SchemaField({
                    physical: bonusField('DAGGERHEART.GENERAL.Damage.physicalDamage'),
                    magical: bonusField('DAGGERHEART.GENERAL.Damage.magicalDamage')
                })
            })
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/dragon-head.svg';

    /* -------------------------------------------- */

    get attackBonus() {
        return this.attack.roll.bonus;
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (this.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
            const autoHordeDamage = game.settings.get(
                CONFIG.DH.id,
                CONFIG.DH.SETTINGS.gameSettings.Automation
            ).hordeDamage;
            if (autoHordeDamage && changes.system?.resources?.hitPoints?.value) {
                const hordeActiveEffect = this.parent.effects.find(x => x.type === 'horde');
                if (hordeActiveEffect) {
                    const halfHP = Math.ceil(this.resources.hitPoints.max / 2);
                    const newHitPoints = changes.system.resources.hitPoints.value;
                    const previouslyAboveHalf = this.resources.hitPoints.value < halfHP;
                    const loweredBelowHalf = previouslyAboveHalf && newHitPoints >= halfHP;
                    const raisedAboveHalf = !previouslyAboveHalf && newHitPoints < halfHP;
                    if (loweredBelowHalf) {
                        await hordeActiveEffect.update({ disabled: false });
                    } else if (raisedAboveHalf) {
                        await hordeActiveEffect.update({ disabled: true });
                    }
                }
            }
        }
    }

    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        if (game.user.id === userId) {
            if (changes.system?.type) {
                const existingHordeEffect = this.parent.effects.find(x => x.type === 'horde');
                if (changes.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
                    if (!existingHordeEffect)
                        this.parent.createEmbeddedDocuments('ActiveEffect', [
                            {
                                type: 'horde',
                                name: game.i18n.localize('DAGGERHEART.CONFIG.AdversaryType.horde.label'),
                                img: 'icons/magic/movement/chevrons-down-yellow.webp',
                                disabled: true
                            }
                        ]);
                } else {
                    existingHordeEffect?.delete();
                }
            }
        }
    }
}
