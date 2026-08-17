import DHItem from '../../documents/item.mjs';

declare global {
    /** Options used to control the results of an item's getEnrichedDescription() function */
    interface ItemDescriptionOptions {
        /** Where this description is being rendered. Certain elements will appear slightly different depending */
        type?: 'sheet' | 'tooltip';
        /** True if GM notes should be rendered. They will be hidden from players via css */
        gmNotes?: boolean;
    }
}


declare module './base.mjs' {
    export default interface BaseDataItem extends foundry.abstract.TypeDataModel {
        parent: DHItem<this>;
        actor: DhpActor;
    }
}