/**
 * @typedef {foundry.data.types.StringFieldOptions} StringFieldOptions
 * @typedef {foundry.data.types.DataFieldContext} DataFieldContext
 */

/**
 * @typedef _FormulaFieldOptions
 * @property {boolean} [deterministic] - Is this formula not allowed to have dice values?
 */

/**
 * @typedef {StringFieldOptions & _FormulaFieldOptions} FormulaFieldOptions
 */

/**
 * Special case StringField which represents a formula.
 */
export default class FormulaField extends foundry.data.fields.StringField {
    /**
     * @param {FormulaFieldOptions} [options] - Options which configure the behavior of the field
     * @param {foundry.data.types.DataFieldContext} [context] - Additional context which describes the field
     */
    constructor(options, context) {
        super(options, context);
    }

    /** @inheritDoc */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, {
            deterministic: false
        });
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _validateType(value) {
        const roll = new Roll(value.replace(/@([a-z.0-9_-]+)/gi, '1'));
        roll.evaluateSync({ strict: false });
        if (this.options.deterministic && !roll.isDeterministic)
            throw new Error(`must not contain dice terms: ${value}`);
        super._validateType(value);
    }

    /* -------------------------------------------- */
    /*  Active Effect Integration                   */
    /* -------------------------------------------- */

    /** @override */
    _castChangeDelta(delta) {
        return this._cast(delta).trim();
    }

    /* -------------------------------------------- */

    /** @override */
    _applyChangeAdd(value, delta, model, change) {
        if (!value) return delta;
        const operator = delta.startsWith('-') ? '-' : '+';
        delta = delta.replace(/^[+-]/, '').trim();
        return `${value} ${operator} ${delta}`;
    }

    /* -------------------------------------------- */

    /** @override */
    _applyChangeMultiply(value, delta, model, change) {
        if (!value) return delta;
        const terms = new Roll(value).terms;
        if (terms.length > 1) return `(${value}) * ${delta}`;
        return `${value} * ${delta}`;
    }

    /* -------------------------------------------- */

    /** @override */
    _applyChangeUpgrade(value, delta, model, change) {
        if (!value) return delta;
        const terms = new Roll(value).terms;
        if (terms.length === 1 && terms[0].fn === 'max') return value.replace(/\)$/, `, ${delta})`);
        return `max(${value}, ${delta})`;
    }

    /* -------------------------------------------- */

    /** @override */
    _applyChangeDowngrade(value, delta, model, change) {
        if (!value) return delta;
        const terms = new Roll(value).terms;
        if (terms.length === 1 && terms[0].fn === 'min') return value.replace(/\)$/, `, ${delta})`);
        return `min(${value}, ${delta})`;
    }
}
