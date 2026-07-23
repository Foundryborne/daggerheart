import { DHDamageData, DHResourceData } from '../fields/action/damageField.mjs';

declare module './baseAction.mjs' {
    export default interface DHBaseAction {
        _id: string;
        systemPath: string;
        type?: string;
        baseAction: boolean;
        name?: string;
        description: string;
        img?: string;
        chatDisplay: boolean;
        originItem: object;
        actionType: string;
        targetUuid?: string;
        
        damage: {
            main: DHDamageData;
            /** An iterable record of items (todo: type the iterable record) */
            resources: Record<string, DHResourceData>;
        }
    }
}
