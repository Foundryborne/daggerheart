import { pseudoDocuments } from "../data/_module.mjs";

//CONFIG.daggerheart.pseudoDocuments
export default {
  feature: {
    label: "DAGGERHEART.Feature.Label",
    documentClass: pseudoDocuments.feature.BaseFeatureData,
    types: {
      weapon:{
        label: "DAGGERHEART.Feature.Weapon.Label",
        documentClass: pseudoDocuments.feature.WeaponFeature,
      }
    }
  }
};