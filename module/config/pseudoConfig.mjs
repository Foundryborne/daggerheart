import { pseudoDocuments } from "../data/_module.mjs";
import { pseudoDocumentSheet } from "../applications/_module.mjs";

//CONFIG.daggerheart.pseudoDocuments
export default {
  sheetClass: pseudoDocumentSheet.PseudoDocumentSheet,
  feature: {
    label: "DAGGERHEART.Feature.Label",
    documentClass: pseudoDocuments.feature.BaseFeatureData,
    types: {
      weapon: {
        label: "DAGGERHEART.Feature.Weapon.Label",
        documentClass: pseudoDocuments.feature.WeaponFeature,
      }
    }
  }
};