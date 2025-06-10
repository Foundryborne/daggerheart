import DHDamageData from "./damage.mjs";
import { abilities } from "../../config/actorConfig.mjs";
// import DHWeapon from "../item/weapon.mjs";

export default class DHAction extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            id: new fields.DocumentIdField(),
            name: new fields.StringField({ initial: 'New Action' }),
            damage: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.damageTypes, nullable: true, initial: null }),
                value: new fields.StringField({})
            }),
            healing: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.healingTypes, nullable: true, initial: null }),
                value: new fields.StringField()
            }),
            conditions: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    icon: new fields.StringField(),
                    description: new fields.StringField()
                })
            ),
            cost: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.abilityCosts, nullable: true, initial: null }),
                value: new fields.NumberField({ nullable: true, initial: null })
            }),
            target: new fields.SchemaField({
                type: new fields.StringField({
                    choices: SYSTEM.ACTIONS.targetTypes,
                    initial: SYSTEM.ACTIONS.targetTypes.other.id
                })
            })
        };
    }
}

const fields = foundry.data.fields;

// Create Roll Field
// Create Damage Field

export class DHBaseAction extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            _id: new fields.DocumentIdField(),
            type: new fields.StringField({ initial: undefined, readonly: true, required: true }),
            name: new fields.StringField({ initial: undefined }),
            img: new fields.FilePathField({ initial: undefined, categories: ["IMAGE"], base64: false }),
            actionType: new fields.StringField({ choices: SYSTEM.ITEM.actionTypes, initial: 'action', nullable: true }),
            roll: new fields.SchemaField({
                type: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.GENERAL.rollTypes }),
                trait: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.ACTOR.abilities }),
                difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
            }),
            cost: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({ choices: SYSTEM.GENERAL.abilityCosts, nullable: false, required: true, initial: 'hope' }),
                    value: new fields.NumberField({ nullable: true, initial: 1 }),
                    scalable: new fields.BooleanField({ initial: false }),
                    step: new fields.NumberField({ nullable: true, initial: null }),
                })
                /* ,
                { initial: [
                    { type: "hope", value: 1, scalable: false, step: null },
                    { type: "stress", value: 2, scalable: true, step: 2 }
                ]} */
            ),
            uses: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                max: new fields.NumberField({ nullable: true, initial: null }),
                recovery: new fields.StringField({ choices: SYSTEM.GENERAL.refreshTypes, initial: null, nullable: true })
            }),
            /* duration: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                units: new fields.StringField({ required: true, blank: false, initial: "instant" })
            }), */
            target: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.ACTIONS.targetTypes, initial: SYSTEM.ACTIONS.targetTypes.other.id })
            }),
            range: new fields.StringField({ choices: SYSTEM.GENERAL.range, required: true, blank: false, initial: "self" }),
            effects: new fields.ArrayField( // ActiveEffect
                new fields.SchemaField({
                    '_id': new fields.DocumentIdField()
                })
            )
        }
    }
    
    prepareData() {}

    get index() {
        return this.parent.actions.indexOf(this);
    }

    get item() {
        return this.parent.parent;
    }

    get actor() {
        return this.item?.actor;
    }

    static getRollType() {
        return 'ability';
    }

    static getSourceConfig(parent) {
        const updateSource = {};
        updateSource.img ??= parent?.img ?? parent?.system?.img;
        if(parent?.system?.trait) {
            updateSource['roll'] = {
                type: this.getRollType(),
                trait: parent.system.trait
            };
        }
        if(parent?.system?.range) {
            updateSource['range'] = parent?.system?.range;
        }
        return updateSource;
    }

    async use(event) {
        console.log(this)
        // console.log(this.item.getRollData(), this.item.actor.getRollData())

        // const weapon = await fromUuid(button.dataset.weapon);
        let damage, modifier, roll, hope, fear, advantage, disadvantage, modifiers, bonusDamageString, targets;
        if(this.damage.parts.length) {
            damage = {
                value: `${this.actor.system[this.damage.parts[0].multiplier].value}${this.damage.parts[0].dice}`,
                type: this.damage.parts[0].type,
                bonusDamage: [this.damage.parts[0].bonus ?? 0, ...this.actor.system.bonuses.damage]
            };
            damage.value = damage.value.concat(bonusDamageString);
        }
        if(this.roll.type && this.roll.trait) {
            modifier = this.actor.system.traits[this.roll.trait].value;
            ({roll, hope, fear, advantage, disadvantage, modifiers, bonusDamageString} =
                await this.actor.dualityRoll(
                    { title: game.i18n.localize(abilities[this.roll.trait].label), value: modifier },
                    event.shiftKey,
                    damage?.bonusDamage ?? 0
                ));
        }
        console.log(roll, hope, fear, advantage, disadvantage, modifiers, bonusDamageString)
        // if(this.target?.type) {
            targets = Array.from(game.user.targets).map(x => ({
                id: x.id,
                name: x.actor.name,
                img: x.actor.img,
                difficulty: x.actor.system.difficulty,
                evasion: x.actor.system.evasion.value
            }));
        // }

        const systemData = {
            title: this.item.name,
            origin: this.actor.id,
            roll: roll._formula,
            modifiers: modifiers,
            hope: hope,
            fear: fear,
            advantage: advantage,
            disadvantage: disadvantage,
            damage: damage,
            targets: targets
        };

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            type: 'dualityRoll',
            sound: CONFIG.sounds.dice,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/attack-roll.hbs',
                systemData
            ),
            rolls: [roll]
        });

        await cls.create(msg.toObject());
    }
}

export class DHAttackAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            /* attack: new fields.SchemaField({
                trait: new fields.StringField({ required: true, choices: SYSTEM.ACTOR.abilities, initial: 'agility' }),
                bonus: new fields.NumberField({ nullable: true, initial: null })
            }), */
            /* damage: new fields.SchemaField({
                baseDamage: new fields.BooleanField({ initial: true }),     // Add damage from source item ?
                parts: new fields.ArrayField(
                    new fields.SchemaField({                              // Create DamageField
                        type: new fields.StringField({
                            choices: SYSTEM.GENERAL.damageTypes,
                            initial: 'physical'
                        }),
                        value: new FormulaField({ initial: 'd6' }),
                        bonus: new fields.NumberField({ nullable: true, initial: null }),
                        base: new fields.BooleanField({ initial: false, readonly: true })
                    })
                )
            }) */
            damage: new fields.SchemaField({
                parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData)),
                includeBase: new fields.BooleanField({ initial: true })
            })
        }
    }

    static getRollType() {
        return 'weapon';
    }

    prepareData() {
        super.prepareData();
        if ( this.damage.includeBase && !!this.item?.system?.damage ) {
            const baseDamage = this.getParentDamage();
            this.damage.parts.unshift(new DHDamageData(baseDamage));
        }
    }

    getParentDamage() {
        return {
            multiplier: 'proficiency',
            dice: this.item?.system?.damage.value,
            bonus: this.item?.system?.damage.bonus ?? 0,
            type: this.item?.system?.damage.type,
            base: true
        };
    }
}

export class DHSpellCastAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
        }
    }

    static getRollType() {
        return 'spellcast';
    }
}

export class DHResourceAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            resource: new fields.SchemaField({
                target: new fields.StringField({ choices: [], required: true, blank: false, initial: "" }),
                value: new fields.NumberField({ initial: 0 })
            })
        }
    }
}

export class DHDamageAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            damage: new fields.SchemaField({})
        }
    }
}

export class DHHealingAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            type: new fields.StringField({ choices: SYSTEM.GENERAL.healingTypes, required: true, blan: false, initial: SYSTEM.GENERAL.healingTypes.health.id }),
            healing: new fields.SchemaField({})
        }
    }
}

export class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            healing: new fields.SchemaField({})
        }
    }
}

export class DHEffectAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema()
        }
    }
}

export class DHMacroAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema()
        }
    }
}
