import { DHDamageData, DHResourceData } from '../fields/action/damageField.mjs';
import * as dice from './_module.mjs';

/**
 * Data used to build a RollConfig object such as duality rolls.
 * @see RollConfig
 */
interface RollConfigParams {
    event: Event;
    actor: DhActor;
    item: DhItem;
    action: DHBaseAction;
    title: string;
    headerTitle: string;
    actionType: string;
    selectedMessageMode: unknown;
    tierLimit: number;
    modifications: unknown;
    costs: unknown[];
    targets: unknown[];
    countdowns: unknown;
    hasRoll: boolean;
    rollType?: keyof typeof CONFIG.Dice.daggerheart;
    roll: {
        lite?: boolean;
        type?: string;
        trait?: string;
        difficulty?: number;
    };
    damage: unknown;
    damageOptions: {
        groupAttack?: boolean;
    };
    skips: {
        resources?: boolean;
        triggers?: boolean;
        createMessage?: boolean;
        updateCountdowns?: boolean;
        reaction?: boolean;
    };        
    source: {
        /** uuid of the actor this roll is coming from */
        actor: string;
        item: string;
        action: string;
        originItem: string;
    };
    evaluated: dice.DHRoll;
    /** If set, skips creation of dedicated toChat messages of used actions due to it having already been created */
    actionChatMessageHandled: false;
}

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
