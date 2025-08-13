import BaseDataActor from './base.mjs';
import DhLevelData from '../levelData.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import { ActionField, ActionsField } from '../fields/actionField.mjs';
import { adjustDice, adjustRange } from '../../helpers/utils.mjs';
import DHCompanionSettings from '../../applications/sheets-configs/companion-settings.mjs';
import { resourceField, bonusField } from '../fields/actorField.mjs';

export default class DhCompanion extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Companion'];

    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.companion',
            type: 'companion',
            isNPC: false,
            settingSheet: DHCompanionSettings
        });
    }

    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            partner: new ForeignDocumentUUIDField({ type: 'Actor' }),
            resources: new fields.SchemaField({
                stress: resourceField(3, 0, 'DAGGERHEART.GENERAL.stress', true),
                hope: new fields.NumberField({ initial: 0, integer: true, label: 'DAGGERHEART.GENERAL.hope' })
            }),
            evasion: new fields.NumberField({
                required: true,
                min: 1,
                initial: 10,
                integer: true,
                label: 'DAGGERHEART.GENERAL.evasion'
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    value: new fields.NumberField({ integer: true, initial: 0 }),
                    description: new fields.StringField(),
                    core: new fields.BooleanField({ initial: false })
                }),
                {
                    initial: {
                        experience1: { value: 2, core: true },
                        experience2: { value: 2, core: true }
                    }
                }
            ),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    img: 'icons/creatures/claws/claw-bear-paw-swipe-brown.webp',
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
                        bonus: 0
                    },
                    damage: {
                        parts: [
                            {
                                type: ['physical'],
                                value: {
                                    dice: 'd6',
                                    multiplier: 'prof'
                                }
                            }
                        ]
                    }
                }
            }),
            levelData: new fields.EmbeddedDataField(DhLevelData),
            bonuses: new fields.SchemaField({
                damage: new fields.SchemaField({
                    physical: bonusField('DAGGERHEART.GENERAL.Damage.physicalDamage'),
                    magical: bonusField('DAGGERHEART.GENERAL.Damage.magicalDamage')
                })
            })
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/capybara.svg';

    /* -------------------------------------------- */

    get proficiency() {
        return this.partner?.system?.proficiency ?? 1;
    }

    prepareBaseData() {
        this.attack.roll.bonus = this.partner?.system?.spellcastModifier ?? 0;

        for (let levelKey in this.levelData.levelups) {
            const level = this.levelData.levelups[levelKey];
            for (let selection of level.selections) {
                switch (selection.type) {
                    case 'hope':
                        this.resources.hope += selection.value;
                        break;
                    case 'vicious':
                        if (selection.data[0] === 'damage') {
                            this.attack.damage.parts[0].value.dice = adjustDice(this.attack.damage.parts[0].value.dice);
                        } else {
                            this.attack.range = adjustRange(this.attack.range);
                        }
                        break;
                    case 'stress':
                        this.resources.stress.max += selection.value;
                        break;
                    case 'evasion':
                        this.evasion += selection.value;
                        break;
                    case 'experience':
                        Object.keys(this.experiences).forEach(key => {
                            const experience = this.experiences[key];
                            experience.value += selection.value;
                        });
                        break;
                }
            }
        }
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
    }

    async _preDelete() {
        if (this.partner) {
            await this.partner.update({ 'system.companion': null });
        }
    }
}
