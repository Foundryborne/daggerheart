import { itemAbleRollParse } from './utils.mjs';

export default class RegisterHandlebarsHelpers {
    static registerHelpers() {
        Handlebars.registerHelper({
            add: this.add,
            includes: this.includes,
            times: this.times,
            damageFormula: this.damageFormula,
            damageSymbols: this.damageSymbols,
            rollParsed: this.rollParsed
        });
    }

    static add(a, b) {
        const aNum = Number.parseInt(a);
        const bNum = Number.parseInt(b);
        return (Number.isNaN(aNum) ? 0 : aNum) + (Number.isNaN(bNum) ? 0 : bNum);
    }

    static includes(list, item) {
        return list.includes(item);
    }

    static times(nr, block) {
        var accum = '';
        for (var i = 0; i < nr; ++i) accum += block.fn(i);
        return accum;
    }

    static damageFormula(attack, actor) {
        const traitTotal = actor.system.traits?.[attack.roll.trait]?.value;
        const instances = [
            attack.damage.parts.map(x => Roll.replaceFormulaData(x.value.getFormula(), actor)).join(' + '),
            traitTotal
        ].filter(x => x);

        return instances.join(traitTotal > 0 ? ' + ' : ' - ');
    }

    static damageSymbols(damageParts) {
        const symbols = new Set();
        damageParts.forEach(part => symbols.add(...CONFIG.DH.GENERAL.damageTypes[part.type].icon));
        return new Handlebars.SafeString(Array.from(symbols).map(symbol => `<i class="fa-solid ${symbol}"></i>`));
    }

    static rollParsed(value, actor, item, numerical) {
        const isNumerical = typeof numerical === 'boolean' ? numerical : false;
        const result = itemAbleRollParse(value, actor, item);
        return isNumerical && !result ? 0 : result;
    }
}
