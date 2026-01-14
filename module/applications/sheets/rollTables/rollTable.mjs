//Setting RollTable
export default class DhRollTableSheet extends foundry.applications.sheets.RollTableSheet {
    static get PARTS() {
        const parts = super.PARTS;
        return {
            summary: {
                template: 'templates/sheets/rollTable/summary.hbs',
            },
            ...parts
        };5
    }
    static actions = {
        addAltFormula: DhRollTableSheet.#onAddAltFormula,
        removeAltForuma: DhRollTableSheet.#onRemoveAltFormula
    };

    //Add formulafield
    static async #onAddAltFormula(event, target) {}

    //Remove formulafield
    static async #onRemoveAltFormula(event, target) {}
}
