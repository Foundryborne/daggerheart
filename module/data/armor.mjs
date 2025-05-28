export default class DhpArmor extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            equipped: new fields.BooleanField({ initial: false }),
            baseScore: new fields.NumberField({ integer: true, initial: 0 }),
            feature: new fields.StringField({
                choices: SYSTEM.ITEM.armorFeatures,
                integer: false,
                blank: true
            }),
            marks: new fields.SchemaField({
                max: new fields.NumberField({ initial: 6, integer: true }),
                value: new fields.NumberField({ initial: 0, integer: true })
            }),
            baseThresholds: new fields.SchemaField({
                major: new fields.NumberField({ integer: true, initial: 0 }),
                severe: new fields.NumberField({ integer: true, initial: 0 })
            }),
            quantity: new fields.NumberField({ integer: true, initial: 1 }),
            description: new fields.HTMLField({})
        };
    }

    get featureInfo() {
        return this.feature ? CONFIG.daggerheart.ITEM.armorFeatures[this.feature] : null;
    }

    prepareDerivedData() {
        if (this.parent.parent) {
            this.applyLevels();
        }
    }

    // Currently bugged as it double triggers. Should get fixed in an updated foundry version.
    applyLevels() {
        // let armorBonus = 0;
        // for(var level in this.parent.parent.system.levelData.levelups){
        //   var levelData = this.parent.parent.system.levelData.levelups[level];
        //   for(var tier in levelData){
        //     var tierData = levelData[tier];
        //     if(tierData){
        //       armorBonus += Object.keys(tierData.armorOrEvasionSlot).filter(x => tierData.armorOrEvasionSlot[x] === 'armor').length;
        //     }
        //   }
        // }
        // this.marks.max += armorBonus;
    }
}
