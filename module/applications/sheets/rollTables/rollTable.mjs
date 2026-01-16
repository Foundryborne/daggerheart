export default class DhRollTableSheet extends foundry.applications.sheets.RollTableSheet {
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes:['daggerheart', 'sheet', 'dh-style'],
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
                context.flagFields = this.daggerheartFlag.schema.fields;
                context.flagData = this.daggerheartFlag;
                const formulas =[];
                formulas.push({
                    index: 0,
                    key: this.daggerheartFlag.formulaName, //Stored in flags as discussed
                    formula: context.source.formula, //Settinng default formula as part of first element
                    formulaInputName: "formula",
                    keyInputName: "flags.daggerheart.formulaName"
                });
                this.daggerheartFlag.altFormula.forEach((alt,i) =>{
                    formulas.push({
                        index: i+1, //Logic stores not from 0 but from 1 onwards
                        key: alt.key,
                        formula: alt.formula,
                        formulaInputName:`flags.daggerheart.altFormula.${i}.formula`, //for .hbs
                        keyInputName: `flags.daggerheart.altFormula.${i}.key`
                    });
                });
                context.formulaList=formulas;
                context.isListView=formulas.length>1; //Condition to show list view only if more than one entry
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
        //submitData.flags.daggerheart = this.daggerheartFlag.toObject(); caused render headaches 

        super._processSubmitData(event, form, submitData, options);
    }

    static async #onAddAltFormula(_event, target) {
        const currentAltFormula=this.daggerheartFlag.altFormula;
        await this.daggerheartFlag.updateSource({
            altFormula:[...currentAltFormula,{key:"",formula:""}]
        });
        this.render({ internalRefresh: true });
    }

    static async #onRemoveAltFormula(_event, target) {
        const visualIndex = parseInt(target.dataset.index);
        // const currentAltFormula=this.daggerheartFlag.altFormula;
        // if(visualIndex===0) {//If deleting formula at [0] index
        //     if(currentAltFormula.length>0) { //atleast 2 or more entries in altFormula
        //         const newCore = currentAltFormula[0];
        //         const newAlt = currentAltFormula.slice(1);
        //         // await this.document.update({formula: newCore.formula});
        //         await this.daggerheartFlag.updateSource({
        //             formulaName:newCore.key,
        //             altFormula:newAlt
        //         });
        //     }
        //     // } else { //I feel this logic is flawed for what I intended for exactly 2 entries (if one it prepares differently)
        //     //     const newCore = currentAltFormula[0];
        //     //     // await this.document.update({ formula: newCore.formula });
        //     //     await this.daggerheartFlag.updateSource({ 
        //     //         formulaName: "",
        //     //         altFormula: {key:"", formula: newCore.formula} });
        //     // }
        // } else { //normal delete that is not [0] index (1st entry)
        //     const arrayIndex = visualIndex - 1;           
        //     await this.daggerheartFlag.updateSource({
        //         altFormula: currentAltFormula.filter((_, i) => i !== arrayIndex)
        //     });
        // }
        await this.daggerheartFlag.updateSource({
            altFormula: this.daggerheartFlag.altFormula.filter((_, index) => index !== visualIndex)
        });
        this.render({ internalRefresh: true });
    }
}
