export default class CompendiumBrowserSettings extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            excludedAttributionSources: new fields.ArrayField(new fields.StringField()),
            excludedSources: new fields.TypedObjectField(
                new fields.SchemaField({
                    excludedDocumentTypes: new fields.ArrayField(
                        new fields.StringField({ required: true, choices: CONST.SYSTEM_SPECIFIC_COMPENDIUM_TYPES })
                    )
                })
            ),
            excludedPacks: new fields.TypedObjectField(
                new fields.TypedObjectField(
                    new fields.SchemaField({
                        excludedDocumentTypes: new fields.ArrayField(
                            new fields.StringField({ required: true, choices: CONST.SYSTEM_SPECIFIC_COMPENDIUM_TYPES })
                        )
                    })
                )
            )
        };
    }

    isEntryExcluded(item) {
        if (this.excludedAttributionSources.includes(item.system.attribution?.source)) {
            return true;
        }

        const pack = game.packs.get(item.pack);
        if (!pack) return false;

        const packageName = pack.metadata.packageType === 'world' ? 'world' : pack.metadata.packageName;
        const excludedSourceData = this.excludedSources[packageName];
        if (excludedSourceData && excludedSourceData.excludedDocumentTypes.includes(pack.metadata.type)) return true;

        const excludedPackData = this.excludedPacks[packageName]?.[pack.metadata.name];
        if (excludedPackData && excludedPackData.excludedDocumentTypes.includes(pack.metadata.type)) return true;

        return false;
    }
}
