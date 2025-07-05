import { getWidthOfText } from './utils.mjs';

export default class RegisterHandlebarsHelpers {
    static registerHelpers() {
        Handlebars.registerHelper({
            times: this.times,
            join: this.join,
            add: this.add,
            subtract: this.subtract,
            includes: this.includes,
            case: this.case,
        });
    }

    static times(nr, block) {
        var accum = '';
        for (var i = 0; i < nr; ++i) accum += block.fn(i);
        return accum;
    }

    static join(...options) {
        return options.slice(0, options.length - 1);
    }

    static add(a, b) {
        const aNum = Number.parseInt(a);
        const bNum = Number.parseInt(b);
        return (Number.isNaN(aNum) ? 0 : aNum) + (Number.isNaN(bNum) ? 0 : bNum);
    }

    static subtract(a, b) {
        const aNum = Number.parseInt(a);
        const bNum = Number.parseInt(b);
        return (Number.isNaN(aNum) ? 0 : aNum) - (Number.isNaN(bNum) ? 0 : bNum);
    }


    static includes(list, item) {
        return list.includes(item);
    }


    static case(value, options) {
        if (value == this.switch_value) {
            this.switch_break = true;
            return options.fn(this);
        }
    }
}
