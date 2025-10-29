export default class DHSystemMessage extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            useTitle: new fields.BooleanField({ initial: true })
        };
    }
}
