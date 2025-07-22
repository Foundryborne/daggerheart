import BaseDataActor from './base.mjs';
import DhLevelData from '../levelData.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import ActionField from '../fields/actionField.mjs';
import { adjustDice, adjustRange } from '../../helpers/utils.mjs';
import DHCompanionSettings from '../../applications/sheets-configs/companion-settings.mjs';
import { resourceField, bonusField } from '../fields/actorField.mjs';

export default class DhCompanion extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Companion'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.companion',
            type: 'companion',
            isNPC: false,
            settingSheet: DHCompanionSettings
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            partner: new ForeignDocumentUUIDField({ type: 'Actor' }),
            resources: new fields.SchemaField({
                stress: resourceField(3, 'DAGGERHEART.GENERAL.stress', true),
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
                    value: new fields.NumberField({ integer: true, initial: 0 })
                }),
                {
                    initial: {
                        experience1: { value: 2 },
                        experience2: { value: 2 }
                    }
                }
            ),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    img: 'icons/creatures/claws/claw-bear-paw-swipe-brown.webp',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
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
            actions: new fields.ArrayField(new ActionField()),
            levelData: new fields.EmbeddedDataField(DhLevelData),
            bonuses: new fields.SchemaField({
                damage: new fields.SchemaField({
                    physical: bonusField('DAGGERHEART.GENERAL.Damage.physicalDamage'),
                    magical: bonusField('DAGGERHEART.GENERAL.Damage.magicalDamage')
                })
            })
        };
    }

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

    async _preDelete() {
        if (this.partner) {
            await this.partner.update({ 'system.companion': null });
        }
    }
}
