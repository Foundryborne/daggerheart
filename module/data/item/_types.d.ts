import DhItem from '../../documents/item.mjs';
import DHAttackAction from '../action/attackAction.mjs';

declare global {
    /** Options used to control the results of an item's getEnrichedDescription() function */
    interface ItemDescriptionConfig {
        /** Where this description is being rendered. Certain elements will appear slightly different depending */
        type?: 'sheet' | 'embed';
        /** True if GM notes should be rendered. They will be hidden from players via css */
        gmNotes?: boolean;
    }
}


declare module './base.mjs' {
    export default interface BaseDataItem extends foundry.abstract.TypeDataModel {
        parent: DhItem<this>;
    }
}

declare module './weapon.mjs' {
    export default interface DHWeapon extends BaseDataItem {
        tier: number;
        equipped: boolean;
        secondary: boolean;
        burden: keyof typeof CONFIG.DH.GENERAL.burden;
        itemFeatures: Record<string, {
            value: string;
            effectIds: string[];
            actionIds: string[];
            config: object;
        }>;
        attack: DHAttackAction;
    }
}