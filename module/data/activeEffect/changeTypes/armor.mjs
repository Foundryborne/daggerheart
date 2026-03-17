const fields = foundry.data.fields;

export default class Armor extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            type: new fields.StringField({ required: true, initial: 'armor', blank: false }),
            max: new fields.StringField({
                required: true,
                nullable: false,
                initial: '1',
                label: 'DAGGERHEART.GENERAL.max'
            }),
            armorInteraction: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.activeEffectArmorInteraction,
                initial: CONFIG.DH.GENERAL.activeEffectArmorInteraction.none.id,
                label: 'DAGGERHEART.EFFECTS.Armor.FIELDS.armorInteraction.label',
                hint: 'DAGGERHEART.EFFECTS.Armor.FIELDS.armorInteraction.hint'
            })
        };
    }

    static changeEffect = {
        label: 'Armor',
        defaultPriortiy: 20,
        handler: (actor, change, _options, _field, replacementData) => {
            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    key: 'system.armorScore.value',
                    type: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                    value: change.value
                },
                replacementData
            );
            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    key: 'system.armorScore.max',
                    type: CONFIG.DH.GENERAL.activeEffectModes.add.id,
                    value: change.max
                },
                replacementData
            );
            return {};
        },
        render: null
    };

    get isSuppressed() {
        switch (this.armorInteraction) {
            case CONFIG.DH.GENERAL.activeEffectArmorInteraction.active.id:
                return !this.parent.parent?.actor.system.armor;
            case CONFIG.DH.GENERAL.activeEffectArmorInteraction.inactive.id:
                return Boolean(this.parent.parent?.actor.system.armor);
            default:
                return false;
        }
    }

    static getInitialValue() {
        return {
            key: 'Armor',
            type: CONFIG.DH.GENERAL.activeEffectModes.armor.id,
            value: 0,
            typeData: {
                type: 'armor',
                max: 0
            },
            phase: 'initial',
            priority: 20
        };
    }

    /* Helpers */

    get armorChange() {
        if (this.changes.length !== 1)
            throw new Error('Unexpected error. An armor effect should have a changes field of length 1.');

        const actor = this.parent.actor?.type === 'character' ? this.parent.actor : null;
        const changeData = this.changes[0];
        const maxParse = actor ? itemAbleRollParse(changeData.max, actor, this.parent.parent) : null;
        const maxRoll = maxParse ? new Roll(maxParse).evaluateSync() : null;
        const maxEvaluated = maxRoll ? (maxRoll.isDeterministic ? maxRoll.total : null) : null;

        return {
            ...changeData,
            max: maxEvaluated ?? changeData.max
        };
    }

    get armorData() {
        return { value: this.armorChange.value, max: this.armorChange.max };
    }

    async updateArmorMax(newMax) {
        const { effect, ...baseChange } = this.armorChange;
        const newChanges = [
            {
                ...baseChange,
                max: newMax,
                value: Math.min(this.armorChange.value, newMax)
            }
        ];
        await this.parent.update({ 'system.changes': newChanges });
    }

    static orderEffectsForAutoChange(armorEffects, increasing) {
        const getEffectWeight = effect => {
            switch (effect.parent.type) {
                case 'class':
                case 'subclass':
                case 'ancestry':
                case 'community':
                case 'feature':
                case 'domainCard':
                    return 2;
                case 'armor':
                    return 3;
                case 'loot':
                case 'consumable':
                    return 4;
                case 'weapon':
                    return 5;
                case 'character':
                    return 6;
                default:
                    return 1;
            }
        };

        return armorEffects
            .filter(x => !x.disabled && !x.isSuppressed)
            .sort((a, b) =>
                increasing ? getEffectWeight(b) - getEffectWeight(a) : getEffectWeight(a) - getEffectWeight(b)
            );
    }
}
