import BaseDataActor from './base.mjs';
import DhLevelData from '../levelData.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import ActionField from '../fields/actionField.mjs';
import { adjustDice, adjustRange } from '../../helpers/utils.mjs';
import DHCompanionSettings from '../../applications/sheets-configs/companion-settings.mjs';

export default class DhCompanion extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Companion'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.companion',
            type: 'companion',
            settingSheet: DHCompanionSettings
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            partner: new ForeignDocumentUUIDField({ type: 'Actor' }),
            resources: new fields.SchemaField({
                stress: new fields.SchemaField({
                    value: new fields.NumberField({ initial: 0, integer: true }),
                    max: new fields.NumberField({ initial: 3, integer: true }),
                    isReversed: new foundry.data.fields.BooleanField({ initial: true })
                }),
                hope: new fields.NumberField({ initial: 0, integer: true })
            }),
            evasion: new fields.NumberField({ required: true, min: 1, initial: 10, integer: true }),
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
                        type: 'weapon',
                        bonus: 0,
                        trait: 'instinct'
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
            levelData: new fields.EmbeddedDataField(DhLevelData)
        };
    }

    get traits() {
        return {
            instinct: { value: this.attack.roll.bonus }
        };
    }

    get proficiency() {
        return this.partner?.system?.proficiency ?? 1;
    }

    prepareBaseData() {
        const partnerSpellcastingModifier = this.partner?.system?.spellcastingModifiers?.main;
        const spellcastingModifier = this.partner?.system?.traits?.[partnerSpellcastingModifier]?.value;
        this.attack.roll.bonus = spellcastingModifier ?? 0; // Needs to expand on which modifier it is that should be used because of multiclassing;

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

    prepareDerivedData() {
        if (this.partner) {
            this.partner.system.resources.hope.max += this.resources.hope;
        }
    }

    async _preDelete() {
        if (this.partner) {
            await this.partner.update({ 'system.companion': null });
        }
    }
}
