export default class DHToken extends TokenDocument {
    /**
     * Inspect the Actor data model and identify the set of attributes which could be used for a Token Bar.
     * @param {object} attributes       The tracked attributes which can be chosen from
     * @returns {object}                A nested object of attribute choices to display
     */
    static getTrackedAttributeChoices(attributes, model) {
        attributes = attributes || this.getTrackedAttributes();
        const barGroup = game.i18n.localize('TOKEN.BarAttributes');
        const valueGroup = game.i18n.localize('TOKEN.BarValues');

        const bars = attributes.bar.map(v => {
            const a = v.join('.');
            const modelLabel = model ? game.i18n.localize(model.schema.getField(`${a}.value`).label) : null;
            return { group: barGroup, value: a, label: modelLabel ? modelLabel : a };
        });
        bars.sort((a, b) => a.label.compare(b.label));

        const invalidAttributes = ['gold', 'levelData', 'rules.damageReduction.maxArmorMarked.value'];
        const values = attributes.value.reduce((acc, v) => {
            const a = v.join('.');
            if (invalidAttributes.some(x => a.startsWith(x))) return acc;

            const field = model ? model.schema.getField(a) : null;
            const modelLabel = field ? game.i18n.localize(field.label) : null;
            const hint = field ? game.i18n.localize(field.hint) : null;
            acc.push({ group: valueGroup, value: a, label: modelLabel ? modelLabel : a, hint: hint });

            return acc;
        }, []);
        values.sort((a, b) => a.label.compare(b.label));

        return bars.concat(values);
    }
}
