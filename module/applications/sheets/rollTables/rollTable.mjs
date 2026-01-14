//Setting RollTable
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
    
    static actions = {
        addAltFormula: DhRollTableSheet.#onAddAltFormula,
        removeAltForuma: DhRollTableSheet.#onRemoveAltFormula
    };

    //Add formulafield
    static async #onAddAltFormula(event, target) {}

    //Remove formulafield
    static async #onRemoveAltFormula(event, target) {}
}
