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

export class DHBaseAction extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            _id: new fields.DocumentIdField(),
            type: new fields.StringField({ blank: false, required: true, readOnly: true, initial: () => '' }),
            name: new fields.StringField({ initial: 'New Action' }),
            // description: new fields.StringField({}),
            // shortDescription: new fields.StringField({}),
            cost: new fields.SchemaField({
                type: new fields.StringField({ choices: SYSTEM.GENERAL.abilityCosts, nullable: true, initial: null }),
                value: new fields.NumberField({ nullable: true, initial: null })
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                max: new fields.NumberField({ nullable: true, initial: null }),
                recovery: new fields.StringField({
                    // choices: SYSTEM.ACTIONS.targetTypes,
                    // initial: SYSTEM.ACTIONS.targetTypes.other.id
                })
            }),
            duration: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                units: new fields.StringField({required: true, blank: false, initial: "instant"})
            }),
            target: new fields.SchemaField({
                type: new fields.StringField({
                    choices: SYSTEM.ACTIONS.targetTypes,
                    initial: SYSTEM.ACTIONS.targetTypes.other.id
                })
            })
        }
    }
}

export class DHAttackAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            attack: new fields.SchemaField({}),
            damage: new fields.SchemaField({})
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
