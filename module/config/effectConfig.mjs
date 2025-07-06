import { range } from '../config/generalConfig.mjs';

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
        name: 'DAGGERHEART.EFFECTS.ApplyLocations.attackRoll.name'
    },
    damageRoll: {
        id: 'damageRoll',
        name: 'DAGGERHEART.EFFECTS.ApplyLocations.damageRoll.name'
    }
};

export const effectTypes = {
    health: {
        id: 'health',
        name: 'DAGGERHEART.EFFECTS.Types.HitPoints.name',
        values: [],
        valueType: valueTypes.numberString.id,
        parseType: parseTypes.number.id
    },
    stress: {
        id: 'stress',
        name: 'DAGGERHEART.EFFECTS.Types.Stress.name',
        valueType: valueTypes.numberString.id,
        parseType: parseTypes.number.id
    },
    reach: {
        id: 'reach',
        name: 'DAGGERHEART.EFFECTS.Types.Reach.name',
        valueType: valueTypes.select.id,
        parseType: parseTypes.string.id,
        options: Object.keys(range).map(x => ({ name: range[x].name, value: x }))
    },
    damage: {
        id: 'damage',
        name: 'DAGGERHEART.EFFECTS.Types.Damage.name',
        valueType: valueTypes.numberString.id,
        parseType: parseTypes.string.id,
        appliesOn: applyLocations.damageRoll.id,
        applyLocationChoices: {
            [applyLocations.damageRoll.id]: applyLocations.damageRoll.name,
            [applyLocations.attackRoll.id]: applyLocations.attackRoll.name
        }
    }
};
