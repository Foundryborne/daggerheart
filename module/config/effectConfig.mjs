import { range } from './generalConfig.mjs';

export const valueTypes = {
    numberString: {
        id: 'numberString'
    },
    select: {
        id: 'select'
    }
};

export const parseTypes = {
    string: {
        id: 'string'
    },
    number: {
        id: 'number'
    }
};

export const applyLocations = {
    attackRoll: {
        id: 'attackRoll',
        name: 'DAGGERHEART.Effects.ApplyLocations.AttackRoll.Name'
    },
    damageRoll: {
        id: 'damageRoll',
        name: 'DAGGERHEART.Effects.ApplyLocations.DamageRoll.Name'
    }
};

export const effectTypes = {
    health: {
        id: 'health',
        name: 'DAGGERHEART.Effects.Types.Health.Name',
        values: [],
        valueType: valueTypes.numberString.id,
        parseType: parseTypes.number.id
    },
    stress: {
        id: 'stress',
        name: 'DAGGERHEART.Effects.Types.Stress.Name',
        valueType: valueTypes.numberString.id,
        parseType: parseTypes.number.id
    },
    reach: {
        id: 'reach',
        name: 'DAGGERHEART.Effects.Types.Reach.Name',
        valueType: valueTypes.select.id,
        parseType: parseTypes.string.id,
        options: Object.keys(range).map(x => ({ name: range[x].name, value: x }))
    },
    damage: {
        id: 'damage',
        name: 'DAGGERHEART.Effects.Types.Damage.Name',
        valueType: valueTypes.numberString.id,
        parseType: parseTypes.string.id,
        appliesOn: applyLocations.damageRoll.id,
        applyLocationChoices: {
            [applyLocations.damageRoll.id]: applyLocations.damageRoll.name,
            [applyLocations.attackRoll.id]: applyLocations.attackRoll.name
        }
    }
};
