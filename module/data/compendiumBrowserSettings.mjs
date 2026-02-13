export default class CompendiumBrowserSettings extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            excludedSources: new fields.TypedObjectField(
                new fields.SchemaField({
                    excludedDocumentTypes: new fields.ArrayField(
                        new fields.StringField({ required: true, choices: CONST.SYSTEM_SPECIFIC_COMPENDIUM_TYPES })
                    )
                })
            ),
            excludedPacks: new fields.TypedObjectField(
                new fields.SchemaField({
                    excludedDocumentTypes: new fields.ArrayField(
                        new fields.StringField({ required: true, choices: CONST.SYSTEM_SPECIFIC_COMPENDIUM_TYPES })
                    )
                })
            )
        };
    }

    isEntryExcluded(item) {
        const pack = game.packs.get(item.pack);
        if (!pack) return false;

        const packageName = pack.metadata.packageType === 'world' ? 'world' : pack.metadata.packageName;
        const excludedSourceData = this.excludedSources[packageName];
        if (excludedSourceData && excludedSourceData.excludedDocumentTypes.includes(pack.metadata.type)) return true;

        const excludedPackData = this.excludedPacks[item.pack];
        if (excludedPackData && excludedPackData.excludedDocumentTypes.includes(pack.metadata.type)) return true;

        return false;
    }
}
