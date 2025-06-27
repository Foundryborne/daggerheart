import { getWidthOfText } from './utils.mjs';

export default class RegisterHandlebarsHelpers {
    static registerHelpers() {
        Handlebars.registerHelper({
            times: this.times,
            join: this.join,
            add: this.add,
            subtract: this.subtract,
            objectSelector: this.objectSelector,
            includes: this.includes,
            debug: this.debug,
            signedNumber: this.signedNumber,
            length: this.length,
            switch: this.switch,
            case: this.case,
            eq: this.eq,
            ne: this.ne,
            lt: this.lt,
            gt: this.gt,
            lte: this.lte,
            gte: this.gte,
            and: this.and,
            or: this.or
        });
    }

    static eq(v1, v2) {
        return v1 === v2;
    }
    static ne(v1, v2) {
        return v1 !== v2;
    }
    static lt(v1, v2) {
        return v1 < v2;
    }
    static gt(v1, v2) {
        return v1 > v2;
    }
    static lte(v1, v2) {
        return v1 <= v2;
    }
    static gte(v1, v2) {
        return v1 >= v2;
    }
    static and() {
        return Array.prototype.every.call(arguments, Boolean);
    }
    static or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
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

    static objectSelector(options) {
        let { title, values, titleFontSize, ids, style } = options.hash;

        const titleLength = getWidthOfText(title, titleFontSize, true, true);
        const margins = 12;

        const buttons = options.fn();
        const nrButtons = Math.max($(buttons).length - 1, 1);
        const iconWidth = 26;

        const texts = values
            .reduce((acc, x, index) => {
                if (x) {
                    acc.push(
                        `<span class="object-select-item" data-action="viewObject" data-value="${ids[index]}">${x}</span>`
                    );
                }

                return acc;
            }, [])
            .join(' ');

        const html = `<div ${style ? 'style="' + style + '"' : ''}">
            <div class="object-select-display iconbar">
                <span class="object-select-title">${title}</span>
                <div class="object-select-text" style="padding-left: ${titleLength + margins}px; padding-right: ${nrButtons * iconWidth}px;">
                    ${texts}
                </div>
                ${buttons}
            </div>
         </div>
        `;

        return new Handlebars.SafeString(html);
    }

    static includes(list, item) {
        return list.includes(item);
    }

    static signedNumber(number) {
        return number >= 0 ? `+${number}` : number;
    }

    static length(obj) {
        return Object.keys(obj).length;
    }

    static switch(value, options) {
        this.switch_value = value;
        this.switch_break = false;
        return options.fn(this);
    }

    static case(value, options) {
        if (value == this.switch_value) {
            this.switch_break = true;
            return options.fn(this);
        }
    }

    static debug(a) {
        console.log(a);
        return a;
    }
}
