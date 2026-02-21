import { compareValues, itemAbleRollParse } from '../../helpers/utils.mjs';

export class EffectConditionals extends foundry.data.fields.ArrayField {
    constructor(context) {
        super(new EffectConditional(), context);
    }

    static isConditionalSuspended(effect) {
        const actor =
            effect.parent.type === 'character'
                ? effect.parent
                : effect.parent.parent?.type === 'character'
                  ? effect.parent.parent
                  : null;
        if (!actor) return false;

        for (const conditional of effect.system.conditionals) {
            switch (conditional.type) {
                case CONFIG.DH.GENERAL.activeEffectConditionalType.status.id:
                    const hasStatus = Array.from(actor.allApplicableEffects()).some(
                        x => !x.disabled && x.statuses.has(conditional.key)
                    );
                    if (!hasStatus) return true;
                case CONFIG.DH.GENERAL.activeEffectConditionalType.attribute.id:
                    const actorValue = foundry.utils.getProperty(actor, conditional.key);
                    const conditionalValue = game.system.api.documents.DhActiveEffect.effectSafeEval(
                        itemAbleRollParse(conditional.value, actor)
                    );
                    if (!compareValues(actorValue, conditionalValue, conditional.comparator)) return true;
            }
        }

        return false;
    }
}

export class EffectConditional extends foundry.data.fields.SchemaField {
    constructor(context) {
        const fields = foundry.data.fields;

        const schema = {
            target: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.activeEffectConditionalTarget,
                initial: CONFIG.DH.GENERAL.activeEffectConditionalTarget.self.id,
                label: 'DAGGERHEART.GENERAL.Target.single'
            }),
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.activeEffectConditionalType,
                initial: CONFIG.DH.GENERAL.activeEffectConditionalType.status.id,
                label: 'DAGGERHEART.GENERAL.type'
            }),
            key: new fields.StringField({ required: true, label: 'EFFECT.FIELDS.changes.element.key.label' }),
            value: new fields.StringField({ nullable: true, label: 'EFFECT.FIELDS.changes.element.value.label' }),
            comparator: new fields.StringField({
                choices: CONFIG.DH.GENERAL.comparator,
                initial: CONFIG.DH.GENERAL.comparator.eq.id,
                label: 'DAGGERHEART.GENERAL.comparator'
            })
        };

        super(schema, context);
    }

    static getConditionalFieldUseage(conditionalType) {
        let usesValue = false;
        let usesComparator = false;

        if ([CONFIG.DH.GENERAL.activeEffectConditionalType.attribute.id].includes(conditionalType)) {
            usesValue = true;
            usesComparator = true;
        }

        return {
            usesValue,
            usesComparator
        };
    }
}
