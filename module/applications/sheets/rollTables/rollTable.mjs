export default class DhRollTableSheet extends foundry.applications.sheets.RollTableSheet {
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        actions: {
            drawResult: DhRollTableSheet.#onDrawResult,
            addFormula: DhRollTableSheet.#addFormula,
            removeFormula: DhRollTableSheet.#removeFormula
        }
    };

    static buildParts() {
        const { footer, header, sheet, ...parts } = super.PARTS;
        return {
            sheet: {
                ...sheet,
                template: 'systems/daggerheart/templates/sheets/rollTable/sheet.hbs'
            },
            header: { template: 'systems/daggerheart/templates/sheets/rollTable/header.hbs' },
            ...parts,
            summary: { template: 'systems/daggerheart/templates/sheets/rollTable/summary.hbs' },
            footer
        };
    }

    static PARTS = DhRollTableSheet.buildParts();

    async _preRender(context, options) {
        await super._preRender(context, options);

        if (!options.internalRefresh)
            this.daggerheartFlag = new game.system.api.data.DhRollTable(this.document.flags.daggerheart);
    }

    /* root PART has a blank element on _attachPartListeners, so it cannot be used to set the eventListeners for the view mode */
    async _onRender(context, options) {
        super._onRender(context, options);

        for (const element of this.element.querySelectorAll('.system-update-field'))
            element.addEventListener('change', this.updateSystemField.bind(this));
    }

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);

        switch (partId) {
            case 'sheet':
                context.altFormulaOptions = {
                    '': { name: this.daggerheartFlag.formulaName },
                    ...this.daggerheartFlag.altFormula
                };
                context.activeAltFormula = this.daggerheartFlag.activeAltFormula;
                context.selectedFormula = context.activeAltFormula
                    ? this.daggerheartFlag.altFormula[context.activeAltFormula].formula
                    : this.document.formula;
                break;
            case 'header':
                context.altFormulaOptions = {
                    '': { name: this.daggerheartFlag.formulaName },
                    ...this.daggerheartFlag.altFormula
                };
                context.activeAltFormula = this.daggerheartFlag.activeAltFormula;
                break;
            case 'summary':
                context.systemFields = this.daggerheartFlag.schema.fields;
                context.altFormula = this.daggerheartFlag.altFormula;
                context.formulaName = this.daggerheartFlag.formulaName;
                break;
        }

        return context;
    }

    async updateSystemField(event) {
        const { dataset, value } = event.target;
        await this.daggerheartFlag.updateSource({ [dataset.path]: value });
        this.render({ internalRefresh: true });
    }

    /** @override */
    async _processSubmitData(event, form, submitData, options) {
        /* RollTable sends an empty dummy event when swapping from view/edit first time */
        if (Object.keys(submitData).length) {
            if (!submitData.flags.daggerheart.altFormula) submitData.flags.daggerheart.altFormula = {};
            for (const formulaKey of Object.keys(this.document._source.flags.daggerheart?.altFormula ?? {})) {
                if (!submitData.flags.daggerheart.altFormula[formulaKey]) {
                    submitData.flags.daggerheart.altFormula[`-=${formulaKey}`] = null;
                }
            }

            await this.daggerheartFlag.updateSource(submitData.flags.daggerheart);
        }

        super._processSubmitData(event, form, submitData, options);
    }

    /**
     * Roll and draw a TableResult.
     * @this {RollTableSheet}
     * @type {ApplicationClickAction}
     */
    static async #onDrawResult(_event, button) {
        if (this.form) await this.submit({ operation: { render: false } });
        button.disabled = true;
        const table = this.document;
        const selectedFormula = this.daggerheartFlag.getActiveFormula(this.document.formula);
        const tableRoll = await table.roll({ selectedFormula });
        const draws = table.getResultsForRoll(tableRoll.roll.total);
        if (draws.length > 0) {
            if (game.settings.get('core', 'animateRollTable')) await this._animateRoll(draws);
            await table.draw(tableRoll);
        }

        // Reenable the button if drawing with replacement since the draw won't trigger a sheet re-render
        if (table.replacement) button.disabled = false;
    }

    static async #addFormula() {
        await this.daggerheartFlag.updateSource({
            [`altFormula.${foundry.utils.randomID()}`]: game.system.api.data.DhRollTable.getDefaultFormula()
        });
        this.render({ internalRefresh: true });
    }

    static async #removeFormula(_event, target) {
        await this.daggerheartFlag.updateSource({
            [`altFormula.-=${target.dataset.key}`]: null
        });
        this.render({ internalRefresh: true });
    }
}
