import DHBaseActorSettings from "../../applications/sheets/api/actor-setting.mjs";

/**
 * Describes metadata about the actor data model type
 * @typedef {Object} ActorDataModelMetadata
 * @property {string} label - A localizable label used on application.
 * @property {string} type - The system type that this data model represents.
 * @property {Boolean} isNPC - This data model represents a NPC?
 * @property {typeof DHBaseActorSettings} settingSheet - The sheet class used to render the settings UI for this actor type.
 */
export default class BaseDataActor extends foundry.abstract.TypeDataModel {
    /** @returns {ActorDataModelMetadata}*/
    static get metadata() {
        return {
            label: 'Base Actor',
            type: 'base',
            isNPC: true,
            settingSheet: null,
        };
    }

    /**@returns {ActorDataModelMetadata}*/
    get metadata() {
        return this.constructor.metadata;
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            description: new fields.HTMLField({ required: true, nullable: true })
        };
    }

    /**
     * Obtain a data object used to evaluate any dice rolls associated with this Item Type
     * @param {object} [options] - Options which modify the getRollData method.
     * @returns {object}
     */
    getRollData() {
        const data = { ...this };
        return data;
    }
}
