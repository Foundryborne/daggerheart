//Setting RollTable

//import DhRollTableData from 'systems/daggerheart/module/data/rollTable.mjs';
export default class DhRollTableSheet extends foundry.applications.sheets.RollTableSheet {
    static buildParts() {
        const { footer, ...parts } = super.PARTS;
        return {
            ...parts,
            summary: { template: 'systems/daggerheart/templates/sheets/rollTable/summary.hbs' },
            footer
        }
    }
    
    static PARTS = DhRollTableSheet.buildParts();

    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: ['daggerheart', 'sheet', 'dh-style'],
        actions : {
            addAltFormula: DhRollTableSheet.#onAddAltFormula,
         removeAltFormula: DhRollTableSheet.#onRemoveAltFormula
        }
    };

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId,context,options);
        switch(partId) {
            case 'summary':
                context.flagData = this.daggerheartFlag
                break;
        }
        return context;
    }

    async _preRender(context,options) {
        await super._preFirstRender(context,options);
        if (!options.internalReferesh)
            this.daggerheartFlag = new game.system.api.data.scenes.DHScene(this.document.flags.daggerheart)
    }

    /** @override */
    async _processSubmitData(event, form, submitData, options) {
        submitData.flags.daggerheart = this.daggerheartFlag.toObject();

        super._processSubmitData(event, form, submitData, options);
    }
    
    static actions = {
        addAltFormula: DhRollTableSheet.#onAddAltFormula,
        removeAltFormula: DhRollTableSheet.#onRemoveAltFormula
    };

    //Add formulafield
    static async #onAddAltFormula(event, target) {
        
    }

    //Remove formulafield
    static async #onRemoveAltFormula(event, target) {

    }
}
