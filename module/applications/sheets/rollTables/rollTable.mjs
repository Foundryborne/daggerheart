export default class DhRollTableSheet extends foundry.applications.sheets.RollTableSheet {
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        actions: {
            addAltFormula: DhRollTableSheet.#onAddAltFormula,
            removeAltFormula: DhRollTableSheet.#onRemoveAltFormula
        }
    };

    static buildParts() {
        const { footer, ...parts } = super.PARTS;
        const test = {
            ...parts,
            summary: { template: 'systems/daggerheart/templates/sheets/rollTable/summary.hbs' },
            footer
        };
        return test;
    }

    static PARTS = DhRollTableSheet.buildParts();

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);

        switch (partId) {
            case 'summary':
                context.flagData = this.daggerheartFlag;
                break;
        }

        return context;
    }

    async _preRender(context, options) {
        await super._preRender(context, options);

        if (!options.internalReferesh)
            this.daggerheartFlag = new game.system.api.data.DhRollTable(this.document.flags.daggerheart);
    }

    /** @override */
    async _processSubmitData(event, form, submitData, options) {
        submitData.flags.daggerheart = this.daggerheartFlag.toObject();

        super._processSubmitData(event, form, submitData, options);
    }

    static async #onAddAltFormula(_event, target) {}

    static async #onRemoveAltFormula(_event, target) {}
}
